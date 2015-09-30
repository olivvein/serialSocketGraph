
var config = require('./configuration');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');
var static = require('node-static');
var EventEmitter = require('events').EventEmitter;
var url = require('url');
var qs = require('querystring');
var http = require('http');

var sp = [];
var allPorts = [];
var patientId=1;
var minIn=200;
var maxIn=400;
var minOut=0;
var maxOut=100;




app.listen(config.webPort);
var fileServer = new static.Server('./i');


http.get('http://127.0.0.1:8080', function(res) {
	// valid response, enable webcam
	console.log('enabling webcam');
	config.showWebCam = true;
}).on('socket', function(socket) {
	// 2 second timeout on this socket
	socket.setTimeout(2000);
	socket.on('timeout', function() {
		this.abort();
	});
}).on('error', function(e) {
	console.log('Got error: '+e.message+' not enabling webcam')
});


function emitToPortSockets(port, evt, obj) {
	for (var i=0; i<sp[port].sockets.length; i++) {
		sp[port].sockets[i].emit(evt, obj);
	}
}


function handler (req, res) {

	//console.log(req.url);

	if (req.url.indexOf('/api/uploadGcode') == 0 && req.method == 'POST') {
		// this is a gcode upload, probably from jscut
		console.log('new data from jscut');
		var b = '';
		req.on('data', function (data) {
			b += data;
			if (b.length > 1e6) {
				req.connection.destroy();
			}
		});
		req.on('end', function() {
			var post = qs.parse(b);
			//console.log(post);
			io.sockets.emit('gcodeFromJscut', {'val':post.val});
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end(JSON.stringify({'data':'ok'}));
		});
	} else {
		fileServer.serve(req, res, function (err, result) {
			if (err) console.log('fileServer error: ',err);
		});
	}
}










serialport.list(function (err, ports) {

	// if on rPi - http://www.hobbytronics.co.uk/raspberry-pi-serial-port
	if (fs.existsSync('/dev/ttyAMA0') && config.usettyAMA0 == 1) {
		ports.push({comName:'/dev/ttyAMA0',manufacturer: undefined,pnpId: 'raspberryPi__GPIO'});
		console.log('adding /dev/ttyAMA0 because it is enabled in config.js, you may need to enable it in the os - http://www.hobbytronics.co.uk/raspberry-pi-serial-port');
	}

	allPorts = ports;

	for (var i=0; i<ports.length; i++) {
	!function outer(i){

		sp[i] = {};
		sp[i].port = ports[i].comName;
		sp[i].q = [];
		sp[i].qCurrentMax = 0;
		sp[i].lastSerialWrite = [];
		sp[i].lastSerialReadLine = '';
		// 1 means clear to send, 0 means waiting for response
		sp[i].handle = new SerialPort(ports[i].comName, {
			parser: serialport.parsers.readline("\n"),
			baudrate: config.serialBaudRate
		});
		sp[i].sockets = [];

		sp[i].handle.on("open", function() {

			console.log('connected to '+sp[i].port+' at '+config.serialBaudRate);

			// line from serial port
			sp[i].handle.on("data", function (data) {
				serialData(data, i);
			});

			// loop for status ?
			setInterval(function() {
				// console.log('writing ? to serial');
				sp[i].handle.write('?');
			}, 1000);

		});

	}(i)
	}

});

function mapNumber(number,in_min, in_max, out_min, out_max) {
  return (number - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


function mapChiffre(x, in_min,in_max, out_min, out_max)
{
  valeur= (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  if (valeur<out_min){
  valeur=out_min;
  }
return valeur;
}

var http = require('http');

function sendToApi(datas) {

    return http.get({
        host: 'medilib-greenberry.rhcloud.com',
        path: '/api/medilibs/bpm/'+patientId+'/'+datas
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
	    console.log(parsed);
        });
    });

}



function serialData(data, port) {

	//console.log("Valeur Réelle : "+data);
	var dataS =mapChiffre(data,minIn,maxIn,minOut,maxOut);
	console.log(dataS);
	//sendToApi(dataS);
	emitToPortSockets(port, 'serialRead', {'line':'<span style="color: green;">RESP: '+dataS+'</span>'});

}


