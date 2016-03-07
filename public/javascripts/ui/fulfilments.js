var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';

var beginApiUrl = '/api/fulfilments/ongoing/begin';
var aliveApiUrl = '/api/fulfilments/ongoing/alive';
var endApiUrl = '/api/fulfilments/ongoing/end';
var getApiUrl = '/api/fulfilments/ongoing';
var deleteApiUrl = '/api/fulfilments/ongoing';

// Form validator

var validate = function() {
    return _validate(function(){
        var dates = makeDates();
        if (!dates.start.isValid()) {
        	$('#input.start_date').addClass('has-error');
        	$('#input.start_time').addClass('has-error');
        	_message('The start date is not valid.', true);
        	return false;
        }
        if (!dates.end.isValid()) {
        	$('#input.end_date').addClass('has-error');
        	$('#input.end_time').addClass('has-error');
        	_message('The end date is not valid.', true);
        	return false;
        }
        if (dates.start > dates.end) {
        	$('#input.start_date').addClass('has-error');
        	$('#input.start_time').addClass('has-error');
        	$('#input.end_date').addClass('has-error');
        	$('#input.end_time').addClass('has-error');
        	_message('The end date must be after the start date.', true);
        	return false;
        }
        return true;
    })
};

var add = function(next) {
	var next = next || '/';
	var dates = makeDates();
	if (validate()){
		var params = {
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"username": $('#inputUsername').val()
		};
		_update(addApiUrl, next, params);
	}
};

var update = function(next, id) {
	var next = next || '/';
	var dates = makeDates();
	if (validate()){
		var params = {
			"id": id,
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"username": $('#inputUsername').val()
		};
		_update(updateApiUrl, next, params);
	}
};

var del = function(next, id) {
	var next = next || '/';
	_del(updateApiUrl, next, id);
};

var cancel = function(next) {
	// Remove message when user navigates away
	window.onbeforeunload = null;

	$('#timer').timer('pause');
	$('#btnStop').attr('disabled', true);

	if ($('#timer').data('state') == 'stopped'){
		window.location = next;
	}
	else {
		_del(deleteApiUrl, next, user);
	}
};

var stop = function(next) {
	// Remove message when user navigates away
	window.onbeforeunload = null;

	$('#timer').timer('pause');
	$('#btnStop').attr('disabled', true);
	_post(endApiUrl, {
    	username: user
    }, function(res) {
    	if (!res.time) {
    		window.location = next;
    	}
    	else {
    		window.location = next;
    	}
    });
};

var toggle = function(next) {
	var state = $('#timer').data('state');

	switch (state) {
		case 'running':
			$('#timer').timer('pause');
			$('#btnStart').text('Start');
			break;

		case 'paused':
			$('#timer').timer('resume');
			$('#btnStart').text('Pause');
			break;

		case 'stopped':
			$('#timer').timer('restart');
			$('#btnStart').text('Pause');
			break;

		default:
			_post(beginApiUrl, {
	        	username: user
	        }, function(res) {
	        	console.log('Begin', res);
	        	if (res.error) {
	        		$('#message').text('We have run into a problem and cannot log your session right now. Please try again later.');
	        		$('#message').addClass('text-danger');
	        	}
	        	else {
	        		if (res.time > 0) {
	        			$('#message').text('We found a previous session and resumed it for you. If you want to begin again, please press \'Finish\' or \'Cancel\'.');
	        		}
		        	$('#timer').timer({
		        		seconds: (res.time / 1000) || 0,
						format: '%H:%M:%S',
						duration: '10s',
					    callback: function() {
					        _post(aliveApiUrl, {
					        	username: user
					        }, function(res) {
					        	if (!res.time) {
					        		window.onbeforeunload = null;
					        		window.location = next;
					        	}
					        	else {
					        		console.log('Alive', res);
					        	}
					        });
					    },
					    repeat: true
					});
					$('#btnStart').text('Pause');
					$('#btnStop').attr('disabled', false);

					// Set up message when user navigates away
					window.onbeforeunload = function (e) {
					    e = e || window.event;

					    var message = 'Please use the \'Finish\' or \'Cancel\' buttons to end your session.';

					    // For IE6-8 and Firefox prior to version 4
					    if (e) {
					        e.returnValue = message;
					    }

					    // For Chrome, Safari, IE8+ and Opera 12+
					    return message;
					};
	        	}
	        });
			break;
	}
};

$(function() {
	initPickers(true);

	// Is there an ongoing transaction already?
	getApiUrl = getApiUrl + '/' + user;
	_get(getApiUrl, function(res){
		if (res.error) {
			$('#message').text('We have run into a problem and cannot log your session right now. Please try again later.');
	        $('#message').addClass('text-danger');
		}
		else {
			if (res.time > 0 || $.urlParam('start') == 'true') {
				toggle();
			}
		}
	});
});
