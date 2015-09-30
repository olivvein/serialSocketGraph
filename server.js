
var config = require('./configuration');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var fs = require('fs');


var sp = [];
var allPorts = [];
var patientId=1;
var minIn=0;
var maxIn=1023;
var minOut=0;
var maxOut=100;


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
	sendToApi(dataS);


}


