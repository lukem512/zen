var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';

var beginApiUrl = '/api/fulfilments/ongoing/begin';
var aliveApiUrl = '/api/fulfilments/ongoing/alive';
var endApiUrl = '/api/fulfilments/ongoing/end';
var getApiUrl = '/api/fulfilments/ongoing';
var deleteApiUrl = '/api/fulfilments/ongoing';

var scheduleApiUrl = '/api/pledges/username';
var getFulfilmentsApiUrl = '/api/fulfilments/users';
var getPledgesApiUrl = '/api/pledges/users';

// Configuration

var aliveTimeInterval = 10;
var refreshTimeInterval = 10;

var __schedule = {
	current: null,
	completed: []
};

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

var displaySchedule = function(schedule) {
	var html = 
		'You are ' + 
		dictionary.pledge.verb.past +
		' to ' +
		'<a href=\"/'+dictionary.schedule.noun.plural+'/view/'+schedule._id+'\" target=\"_blank\" title=\"View ' + dictionary.schedule.noun.singular + ' in a new tab\">' +
		schedule.title +
	    '</a>.';

	 html = html +
	 	' The ' +
	 	dictionary.schedule.noun.singular + 
	 	((moment().diff(schedule.start_time) > 0) ? ' began ' : ' begins ') +
	 	'<span class=\"more-info\" data-text=\"' +
	 	moment(schedule.start_time).calendar() + 
	 	'\">' +
	 	moment().to(schedule.start_time) +
	 	'</span> and finishes ' +
	 	'<span class=\"more-info\" data-text=\"' +
	 	moment(schedule.end_time).calendar() + 
	 	'\">' +
	 	moment().to(schedule.end_time) +
	 	'</span>.';
	 	
	$('#schedule').html(html);
};

var getSchedule = function() {
	var url = scheduleApiUrl + '/' + user + '/now';
	_get(url, function(response){
		// Display the schedule
		if (response.schedule) {
			displaySchedule(response.schedule);
			getOnlineUsers(response.schedule._id);
		}
		
		// Update the current schedule object?
		if (__schedule.current != response.schedule.title) {
			if (__schedule.current) {
				__schedule.completed.push(__schedule.current);
			}
			__schedule.current = (response.schedule ? response.schedule.title : null);

			// Play indication sound
			if ($('#timer').data('state') && $('#timer').data('state') != 'stopped')
			{
				var audio = new Audio('/sounds/ding.mp3');
				audio.play();
			}
		}
	}, function(err) {
		console.error(err);
	});
};

// User functionality

var displayUsers = function(absent, present) {
	var html = "";

	var presentList = listUsers(present, true);
	if (presentList.n > 0) {
		html =
			html +
			presentList.html +
			((absentList.n > 1 || list.you) ? " are " : " is ") + 
			"online!";
	}

	var absentList = listUsers(absent, true);
	if (absentList.n > 0) {
		var 
		html =
			html +
			((html.length > 0) ? " " : "") +
			absentList.html +
			((absentList.n > 1 || list.you) ? " are " : " is ") + 
			"not online.";
	}

	$('#users').html(html);
};

var getPledgedUsers = function(id, callback) {
	var url = getPledgesApiUrl + '/' + id;
	_get(url, callback, function(err) {
		console.error(err);
	});
};

var getOnlineUsers = function(id) {
	var url = getFulfilmentsApiUrl + '/' + id;
	getPledgedUsers(id, function(pledged) {
		_get(url, function(fulfilled){
			if (fulfilled.message) {
				return console.error(fulfilled.message);
			};
			var present = fulfilled.map(function(i) {return i.username});
			var absent = pledged.filter(function(i) {return present.indexOf(i) < 0;});
			displayUsers(absent, present);
		});
	}, function(err) {
		console.error(err);
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
						duration: aliveTimeInterval+'s',
					    callback: function() {
					        _post(aliveApiUrl, {
					        	username: user
					        }, function(res) {
					        	if (!res.time) {
					        		window.onbeforeunload = null;
					        		window.location = next;
					        	}
					        	if (hadError) {
					        		$('#message').text('Your progress has been saved!');
					        		$('#message').removeClass('text-danger');
					        		$('#message').addClass('text-success');
				        		}
					        }, function(err) {
					        	console.error(err);
					        	hadError = true;
					        	$('#message').text('We are unable to save your progress - is your Internet connection having trouble? Retrying in ' + aliveTimeInterval + ' seconds.');
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
