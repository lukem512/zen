var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';

var beginApiUrl = '/api/fulfilments/ongoing/begin';
var aliveApiUrl = '/api/fulfilments/ongoing/alive';
var endApiUrl = '/api/fulfilments/ongoing/end';
var getApiUrl = '/api/fulfilments/ongoing';
var deleteApiUrl = '/api/fulfilments/ongoing';

var scheduleApiUrl = '/api/pledges/username';

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

// Schedule functionality

var getSchedule = function() {
	var url = scheduleApiUrl + '/' + user + '/now';
	_get(url, function(response){
		if (response.schedule) {
			var html = 
				'You are ' + 
				dictionary.pledge.verb.past +
				' to ' +
				'<a href=\"/'+dictionary.schedule.noun.plural+'/view/'+response.schedule._id+'\" target=\"_blank\" title=\"View ' + dictionary.schedule.noun.singular + ' in a new tab\">' +
				response.schedule.title +
			    '</a>.';

			 html = html +
			 	' The ' +
			 	dictionary.schedule.noun.singular + 
			 	((moment().diff(response.schedule.start_time) > 0) ? ' began ' : ' begins ') +
			 	moment().to(response.schedule.start_time) +
			 	'.';
			 	
			$('#schedule').html(html);
		}
	});
};

// Events

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

	// Pause the timer
	$('#timer').timer('pause');

	// Disable buttons
	$('#btnStart').attr('disabled', true);
	$('#btnPause').attr('disabled', true);
	$('#btnStop').attr('disabled', true);

	// Send the final results!
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
	var hadError = false;
	var timeInterval = 10;

	switch (state) {
		case 'running':
			$('#timer').timer('pause');
			$('#btnStart').removeClass('hidden');
			$('#btnPause').addClass('hidden');
			break;

		case 'paused':
			$('#timer').timer('resume');
			$('#btnStart').addClass('hidden');
			$('#btnPause').removeClass('hidden');
			break;

		case 'stopped':
			$('#timer').timer('restart');
			$('#btnStart').addClass('hidden');
			$('#btnPause').removeClass('hidden');
			break;

		default:
			_post(beginApiUrl, {
	        	username: user
	        }, function(res) {
	        	if (res.error) {
	        		console.error(res.error);
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
						duration: timeInterval+'s',
					    callback: function() {
					        _post(aliveApiUrl, {
					        	username: user
					        }, function(res) {
					        	if (!res.time) {
					        		window.onbeforeunload = null;
					        		window.location = next;
					        		console.log(hadError);
					        		if (hadError) {
						        		$('#message').text('Your progress has been saved!');
						        		$('#message').removeClass('text-danger');
						        		$('#message').addClass('text-success');
					        		}
					        	}
					        }, function(err) {
					        	console.error(err);
					        	hadError = true;
					        	$('#message').text('We are unable to save your progress - is your Internet connection having trouble? Retrying in ' + timeInterval + ' seconds.');
					        	$('#message').removeClass('text-success');
					        	$('#message').addClass('text-danger');
					        });
					    },
					    repeat: true
					});
					$('#btnStart').addClass('hidden');
					$('#btnPause').removeClass('hidden');
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

	// A schedule soon?
	getSchedule();
});
