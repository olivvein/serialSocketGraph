

$(document).ready(function() {





	// init vars for better controls
	var isMouseDown = false;
	var tsLast = Date.now();

	// get dimensions for better controls

var socket = io.connect('');

	socket.on('serverError', function (data) {
		alert(data);
	});

	socket.on('gcodeFromJscut', function (data) {
		$('#command').val(data.val);
		openGCodeFromText();
		alert('new data from jscut');
	});

	// config from server
	socket.on('config', function (data) {
		if (data.showWebCam == true) {
			// show the webcam and link

			var webroot = window.location.protocol+'//'+window.location.hostname;
			//console.log(webroot);

			$('#wcImg').attr('src', webroot+':'+data.webcamPort+'/?action=stream');

			$('#wcLink').attr('href', webroot+':'+data.webcamPort+'/javascript_simple.html');

			$('#webcam').css('display','inline-block');
		}
	});

	socket.on('ports', function (data) {
		//console.log('ports event',data);
		$('#choosePort').html('<option val="no">Select a serial port</option>');
		for (var i=0; i<data.length; i++) {
			$('#choosePort').append('<option value="'+i+'">'+data[i].comName+':'+data[i].pnpId+'</option>');
		}
		if (data.length == 1) {
			$('#choosePort').val('0');
			$('#choosePort').change();
		}
	});

	socket.on('qStatus', function (data) {
		$('#qStatus').html(data.currentLength+'/'+data.currentMax);
	});

	socket.on('machineStatus', function (data) {
		$('#mStatus').html(data.status);
		$('#mX').html('X: '+data.mpos[0]);
		$('#mY').html('Y: '+data.mpos[1]);
		$('#mZ').html('Z: '+data.mpos[2]);
		$('#wX').html('X: '+data.wpos[0]);
		$('#wY').html('Y: '+data.wpos[1]);
		$('#wZ').html('Z: '+data.wpos[2]);
		//console.log(data);
	});

	socket.on('serialRead', function (data) {
		console.log(data);
		if ($('#console p').length > 300) {
			// remove oldest if already at 300 lines
			$('#console p').first().remove();
		}
		$('#console').append('<p>'+data+'</p>');
		$('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
	});

$('#choosePort').on('change', function() {
		// select port
		socket.emit('usePort', $('#choosePort').val());
		$('#mStatus').html('Port Selected');
	});

console.log("test");
});
