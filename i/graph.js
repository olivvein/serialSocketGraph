
var olivier2=8;
var xPos=0;
$(document).ready(function() {



var olivier="ok";

	// init vars for better controls
	var isMouseDown = false;
	var tsLast = Date.now();

	// get dimensions for better controls

	$( window ).resize(function() {
		// when header resizes, move ui down
		$('.table-layout').css('margin-top',$('.navbar-collapse').height()-34);
	});

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
		console.log('ports event',data);
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
		olivier2=data;
		//console.log("Draw : "+olivier2);
		
		drawGraph();
			
		//console.log('The data : '+data);
		
	});

	$('#choosePort').on('change', function() {
		// select port
		socket.emit('usePort', $('#choosePort').val());
		$('#mStatus').html('Port Selected');
	})

	$('#sendReset').on('click', function() {
		socket.emit('doReset', 1);
	});

	$('#sendGrblHelp').on('click', function() {
		socket.emit('gcodeLine', { line: '$' });
	});

	$('#sendGrblSettings').on('click', function() {
		socket.emit('gcodeLine', { line: '$$' });
	});

	$('#pause').on('click', function() {
		if ($('#pause').html() == 'Pause') {
			// pause queue on server
			socket.emit('pause', 1);
			$('#pause').html('Unpause');
			$('#clearQ').removeClass('disabled');
		} else {
			socket.emit('pause', 0);
			$('#pause').html('Pause');
			$('#clearQ').addClass('disabled');
		}
	});

	$('#clearQ').on('click', function() {
		// if paused let user clear the command queue
		socket.emit('clearQ', 1);
		// must clear queue first, then unpause (click) because unpause does a sendFirstQ on server
		$('#pause').click();
	});

	$('#mpC').on('click', function() {
		$('#mpA').addClass('active');
		$('#wpA').removeClass('active');
		$('#mPosition').show();
		$('#wPosition').hide();
	});

	$('#wpC').on('click', function() {
		$('#wpA').addClass('active');
		$('#mpA').removeClass('active');
		$('#wPosition').show();
		$('#mPosition').hide();
	});

	$('#sendZero').on('click', function() {
		socket.emit('gcodeLine', { line: 'G92 X0 Y0 Z0' });
	});

	$('#sendCommand').on('click', function() {

		socket.emit('gcodeLine', { line: $('#command').val() });
		$('#command').val('');

	});

	// shift enter for send command
	$('#command').keydown(function (e) {
		if (e.shiftKey) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 13) {
				// we have shift + enter
				$('#sendCommand').click();
				// stop enter from creating a new line
				e.preventDefault();
			}
		}
	});

	$('#xM').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' X-'+$('#jogSize').val()+'\nG90'});
	});
	$('#xP').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' X'+$('#jogSize').val()+'\nG90'});
	});
	$('#yP').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' Y'+$('#jogSize').val()+'\nG90'});
	});
	$('#yM').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' Y-'+$('#jogSize').val()+'\nG90'});
	});
	$('#zP').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' Z'+$('#jogSize').val()+'\nG90'});
	});
	$('#zM').on('click', function() {
		socket.emit('gcodeLine', { line: 'G91\nG1 F'+$('#jogSpeed').val()+' Z-'+$('#jogSize').val()+'\nG90'});
	});

	// WASD and up/down keys
	$(document).keydown(function (e) {
		var keyCode = e.keyCode || e.which;

		if ($('#command').is(':focus')) {
			// don't handle keycodes inside command window
			return;
		}

		switch (keyCode) {
		case 65:
			// a key X-
			e.preventDefault();
			$('#xM').click();
			break;
		case 68:
			// d key X+
			e.preventDefault();
			$('#xP').click();
			break;
		case 87:
			// w key Y+
			e.preventDefault();
			$('#yP').click();
			break;
		case 83:
			// s key Y-
			e.preventDefault();
			$('#yM').click();
			break;
		case 38:
			// up arrow Z+
			e.preventDefault();
			$('#zP').click();
			break;
		case 40:
			// down arrow Z-
			e.preventDefault();
			$('#zM').click();
			break;
		}
	});

	// handle gcode uploads
	if (window.FileReader) {

		var reader = new FileReader ();

		// drag and drop
		function dragEvent (ev) {
			ev.stopPropagation (); 
			ev.preventDefault ();
			if (ev.type == 'drop') {
				reader.onloadend = function (ev) {
					document.getElementById('command').value = this.result;
					openGCodeFromText();
				};
				reader.readAsText (ev.dataTransfer.files[0]);
			}  
		}


		// button

	} else {
		alert('your browser is too old to upload files, get the latest Chromium or Firefox');
	}

});
