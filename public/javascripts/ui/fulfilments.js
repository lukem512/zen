var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';

var beginApiUrl = '/api/fulfilments/ongoing/begin';
var aliveApiUrl = '/api/fulfilments/ongoing/alive';
var endApiUrl = '/api/fulfilments/ongoing/end';
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
	$('#timer').timer('pause');
	$('#btnStop').attr('disabled', true);
	_post(endApiUrl, {
    	username: user
    }, function(res) {
    	console.log('End', res);
    	window.location = next;
    });
};

var toggle = function() {
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
	        		$('#message').removeClass('hidden');
	        	}
	        	else {
		        	$('#timer').timer({
						format: '%H:%M:%S',
						duration: '30s',
					    callback: function() {
					        _post(aliveApiUrl, {
					        	username: user
					        }, function(res) {
					        	console.log('Alive', res);
					        });
					    },
					    repeat: true
					});
					$('#btnStart').text('Pause');
					$('#btnStop').attr('disabled', false);
	        	}
	        });
			break;
	}
};

$(function() {
	initPickers(true);
});
