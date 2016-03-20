var listApiUrl= '/api/fulfilments/list';
var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';

var beginApiUrl = '/api/fulfilments/ongoing/begin';
var aliveApiUrl = '/api/fulfilments/ongoing/alive';
var endApiUrl = '/api/fulfilments/ongoing/end';
var getApiUrl = '/api/fulfilments/ongoing';
var deleteApiUrl = '/api/fulfilments/ongoing';

var getOnlineApiUrl = '/api/fulfilments/ongoing/users';

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
        if (dates.start.isAfter(dates.end) || dates.start.isSame(dates.end)) {
        	$('#input.start_date').addClass('has-error');
        	$('#input.start_time').addClass('has-error');
        	$('#input.end_date').addClass('has-error');
        	$('#input.end_time').addClass('has-error');
        	_message('The end date must be after the start date.', true);
        	return false;
        }
        if (dates.start.isAfter(moment())) {
        	$('#input.start_date').addClass('has-error');
        	$('#input.start_time').addClass('has-error');
        	_message('The ' + dictionary.fulfilment.noun.singular + ' must be in the past!', true);
        	return false;
        }
        if (dates.end.isAfter(moment())) {
        	$('#input.end_date').addClass('has-error');
        	$('#input.end_time').addClass('has-error');
        	_message('The ' + dictionary.fulfilment.noun.singular + ' must be in the past!', true);
        	return false;
        }
        return true;
    })
};

// Schedule functionality

var displaySchedule = function(schedules) {

	var html = '';

	if (schedules.length) {
		html = 
			'You are ' + 
			dictionary.pledge.verb.past +
			' to';

		var next = schedules[0];
		for (var i = 0; i < schedules.length; i++) {
			if (i == schedules.length - 1 && schedules.length > 1) {
                html += ' and ';
            }
            else if (i < schedules.length - 1 && i > 0) {
                html += ', ';
            }
            else {
                html += ' ';
            }

            var schedule = schedules[i];
            if (schedule.start_time < next.start_time) next = schedule;

			html = html + 
				'<a href=\"/'+dictionary.schedule.noun.plural+'/view/'+schedule._id+'\" target=\"_blank\" title=\"View ' + dictionary.schedule.noun.singular + ' in a new tab\">' +
				schedule.title +
			    '</a>';
		}
		html += '.';

		html = html +
		 	' The ' +
		 	((schedules.length > 1) ? 'first ' : '') +
		 	dictionary.schedule.noun.singular + 
		 	((moment().diff(next.start_time) > 0) ? ' began ' : ' begins ') +
		 	'<span class=\"more-info dotted\" data-text=\"' +
		 	moment(next.start_time).calendar() + 
		 	'\">' +
		 	moment().to(next.start_time) +
		 	'</span> and finishes ' +
		 	'<span class=\"more-info dotted\" data-text=\"' +
		 	moment(next.end_time).calendar() + 
		 	'\">' +
		 	moment().to(next.end_time) +
		 	'</span>.';

		// Display online users
		getOnlineUsers(next._id);
	}
	 	
	$('#schedule').html(html);
};

var dingQueue = {};

var playDing = function() {
	if ($('#timer').data('state') && $('#timer').data('state') !== 'stopped')
	{
		var audio = new Audio('/sounds/ding.mp3');
		audio.play();
	}
}

var getSchedule = function() {
	var url = scheduleApiUrl + '/' + user + '/now';
	_get(url, function(schedules){
		displaySchedule(schedules);

		// Set timeouts for 'ding's
		schedules.forEach(function(s){
			if (!dingQueue[s._id]) {
				var startDiff = (moment().diff(s.start_time));
				if (startDiff < 0) {
					startDiff = startDiff * -1;
					setTimeout(playDing, startDiff);
				}

				var endDiff = (moment().diff(s.end_time));
				if (endDiff < 0) {
					endDiff = endDiff * -1;
					setTimeout(playDing, endDiff);
				}

				dingQueue[s._id] = true;
			}
		});
	}, function(err) {
		console.error(err);
	});
};

// User functionality

var displayUser = function(username, online) {
	var className = (online ? 'text-success' : 'text-danger');
	var html = 
		"<span class=\"" + className + " more-info\" data-text=\"" + 
		((username === user) ? 'You are ' : username + ' is ') +
		(online ? "" : "not ") + "online\">&bull; " +
		"<a href=\"/users/" + username + "\" title=\"View " + 
		((username === user) ? 'your' : username + '\'s') + 
		" profile\" class=\"text-capitalize\">" + 
		((username === user ? 'you' : username)) + "</a></span>";
	return html;
}

var displayUserOffline = function(username) {
	return displayUser(username, false);
};

var displayUserOnline = function(username) {
	return displayUser(username, true);
};

var getPledgedUsers = function(id, callback) {
	var url = getPledgesApiUrl + '/' + id;
	_get(url, callback, function(err) {
		console.error('Could not get pledged users', err);
	});
};

var getFulfilledUsers = function(id, callback) {
	var url = getFulfilmentsApiUrl + '/' + id;
	_get(url, function(fulfilled){
		callback(fulfilled);
	}, function(err) {
		console.error('Could not get fulfilled users', err);
	});
};

var displayUsers = function(absent, present, fulfilled) {

	// Hide the table if there is nothing to show
	if (absent.length == 0 && present.length == 0) {
		$('#ut').addClass('hidden');
		return;
	}
	else if ($('#ut').hasClass('hidden')) {
		$('#ut').removeClass('hidden');
	}

	// Empty the table
	$('#ut-body').empty();

	// Display the present users
	present.forEach(function(username) {
		var completion = '';
		fulfilled.some(function(f){
			if (f.username === username) {
				completion = f.completion;
				return true;
			};
		});
		var onlineString = displayUserOnline(username);
		var completionString = (completion === '' ? '' : ' (<span class=\"text-capitalize\">' + completion + 'ly</span> complete)');
		var html = '<tr id=\"'+ username + '\"><td>' + onlineString + completionString + '</td></tr>';
		$('#ut > tbody:last-child').append(html);
	});

	// And the absent ones
	absent.forEach(function(username) {
		var completion = '';
		fulfilled.some(function(f){
			if (f.username === username) {
				completion = f.completion;
				return true;
			};
		});
		var onlineString = displayUserOffline(username);
		var completionString = (completion === '' ? '' : ' (<span class=\"text-capitalize\">' + completion + 'ly complete</span>)');
		var html = '<tr id=\"'+ username + '\"><td>' + onlineString + completionString + '</td></tr>';
		$('#ut > tbody:last-child').append(html);
	});
};

var getOnlineUsers = function(id) {
	var url = '/api/fulfilments/ongoing/users' + '/' + id;
	_get(url, function(results){
		if (results.message) return console.error(results.message);

		getFulfilledUsers(id, function(fulfilled) {
			var present = results.online;
			var absent = results.pledged.filter(function(i) {return present.indexOf(i) < 0;});
			displayUsers(absent, present, fulfilled);
		});
	}, function(err) {
		console.error('Could not get online users', err);
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
					        	$('#message').text('We are unable to save your progress. Please check your Internet connection. Retrying in ' + aliveTimeInterval + ' seconds.');
					        	$('#message').removeClass('text-success');
					        	$('#message').addClass('text-danger');
					        });
					    },
					    repeat: true
					});
					$('#btnStart').addClass('hidden');
					$('#btnPause').removeClass('hidden');
					$('#btnStop').attr('disabled', false);

					// Update the schedule
					getSchedule();

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
