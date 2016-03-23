var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';

var newPledgeApiUrl = '/api/pledges/new';
var updatePledgeApiUrl = '/api/pledges/update';
var getPledgesApiUrl = '/api/pledges/users';
var getFulfilmentsApiUrl = '/api/fulfilments/users';

var listViewUrl = '/admin/schedules/list';

// Form validator

var validate = function() {
    return _validate(function(){
    	// Validate title
    	if ($('#inputTitle').val() == '') {
    		$('#inputTitle').addClass('has-error');
    		_message('You must enter a title.', true);
    		return false;
    	}

    	// Validate dates
        var dates = makeDates();
        if (!dates.start.isValid()) {
        	$('#inputStartDate').addClass('has-error');
        	$('#inputStartTime').addClass('has-error');
        	_message('The start date is not valid.', true);
        	return false;
        }
        if (!dates.end.isValid()) {
        	$('#inputEndDate').addClass('has-error');
        	$('#inputEndTime').addClass('has-error');
        	_message('The end date is not valid.', true);
        	return false;
        }
        if (dates.start.isAfter(dates.end) || dates.start.isSame(dates.end)) {
        	$('#inputStartDate').addClass('has-error');
        	$('#inputStartTime').addClass('has-error');
        	$('#inputEndDate').addClass('has-error');
        	$('#inputEndTime').addClass('has-error');
        	_message('The end date must be after the start date.', true);
        	return false;
        }
        if (dates.start.isBefore(moment())) {
        	$('#inputStartDate').addClass('has-error');
        	$('#inputStartTime').addClass('has-error');
        	_message('The ' + dictionary.fulfilment.noun.singular + ' must be in the future!', true);
        	return false;
        }
        if (dates.end.isBefore(moment())) {
        	$('#inputEndDate').addClass('has-error');
        	$('#inputEndTime').addClass('has-error');
        	_message('The ' + dictionary.fulfilment.noun.singular + ' must be in the future!', true);
        	return false;
        }
        return true;
    })
};

// Fulfilment functions

var fulfilledUsers = function(id, callback) {
	_get(getFulfilmentsApiUrl + '/' + id, callback);
};

// Pledge functions

var pledgedUsers = function(id, callback) {
	_get(getPledgesApiUrl + '/' + id, callback);
};

var join = function(next, id) {
	var params = {
		username: user,
		schedule: id
	};
	_post(newPledgeApiUrl, params, function() {
		window.location = next;
	}, function(e) {
		console.error(e);
		$('#message').html('You are unable to join at this time. Please try again later.');
		$('#message').addClass('text-danger');
		$('#message').removeClass('hidden');
	});
};

var leave = function(next, id) {
	_del(updatePledgeApiUrl, next, {schedule: id, username: user});
};

// Schedule functions

var add = function(next) {
	var next = next || listViewUrl;
	var dates = makeDates();
	if (validate() && dates.start.isValid() && dates.end.isValid()){
		var owner = $('#inputOwner').find(":selected").text() || $('#inputOwner').val();
		var params = {
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"username": owner
		};
		_update(addApiUrl, next, params);
	}
};

var update = function(next, id) {
	var next = next || listViewUrl;
	var dates = makeDates();
	var id = id || window.__id;
	var owner = $('#inputOwner').find(":selected").text() || $('#inputOwner').val();
	if (validate() && dates.start.isValid() && dates.end.isValid()){
		var params = {
			"id": id,
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"username": owner
		};
		_update(updateApiUrl, next, params);
	}
};

var del = function(next, id) {
	var next = next || listViewUrl;
	var id = id || window.__id;
	_del(updateApiUrl, next, id);
};

var fulfil = function() {
	window.location = '/' + dictionary.action.noun.plural + '/now';
};

var log = function() {
	var start = moment(window.__schedule.start_time);
	var end = moment(window.__schedule.end_time);
	window.location = newDateUrl('/' + dictionary.action.noun.plural + '/log', start, end);
};

var duplicate = function() {
	var start = moment(window.__schedule.start_time);
	var end = moment(window.__schedule.end_time);
	var title = window.__schedule.title;
	var description = window.__schedule.description;
	window.location = newScheduleUrl(start, end, title, description);
};

var displaySoon = function(you) {
	if (window.__ongoing || window.__soon) {
		var now = 
			"This " + dictionary.schedule.noun.singular +
			((window.__past || window.__ongoing) ? " began " : " begins ") +
			moment(window.__start_time).fromNow() + ".";

		if (you && !window.__past) {
			$('#btnFulfil').removeClass('hidden');
			now += ' Would you like to <a href=\"/'+dictionary.action.noun.plural+'/now\">' + dictionary.action.verb.present + ' now</a> to complete your ' + dictionary.pledge.noun.singular + '?'
		}
		$('#now').html(now).removeClass('hidden');
	}

	if (you) {
		$('#btnJoin').addClass('hidden');
		$('#btnLeave').removeClass('hidden');
	}
};

var displayPledgesFuture = function(users) {

	// TODO - remove the owner of the schedule from the list, not you.

	var html = "";
	var list = listUsers(users);

	html = list.html +
		((list.n > 1 || list.you) ? " have " : " has ") +
		dictionary.pledge.verb.past +
		" to attend.";

	displaySoon(list.you);
	$('#pledges').html(html);
};

var displayPledgesPast = function(absent, present) {
	var html = "";

	var presentList = listUsers(present);
	if (presentList.n > 0) {
		html =
			html +
			presentList.html +
			" " + 
			dictionary.fulfilment.verb.past +
			((presentList.you) ? " your " : " their ") +
			((presentList.n > 1) ? dictionary.pledge.noun.plural : dictionary.pledge.noun.singular) +
			" to attend.";
	}

	var absentList = listUsers(absent);
	if (absentList.n > 0) {
		html =
			html +
			((html.length > 0) ? " " : "") +
			absentList.html + " " +
			(window.__ongoing
				? (((absentList.n > 1 || absentList.you) ? "have" : "has") + " not yet attended")
				: "did not attend") +
			" this " + 
			dictionary.schedule.noun.singular +
			".";
	}

	displaySoon(presentList.you);

	if (absentList.you) {
		$('#btnLog').removeClass('hidden');
	}

	$('#pledges').html(html);
};

$(function() {
	var __id = window.__id || false;
	if (__id) {
		pledgedUsers(__id, function(pledged) {
			if (window.__past || window.__ongoing) {
				fulfilledUsers(__id, function(fulfilled) {
					if (fulfilled.message) {
						return console.error(fulfilled.message);
					};
					var present = fulfilled.map(function(i) {return i.username});
					var absent = pledged.filter(function(i) {return present.indexOf(i) < 0;});
					displayPledgesPast(absent, present);
				});
			}
			else {
				displayPledgesFuture(pledged);
			}
		});
	};
});

$(function() {
	if (typeof(initPickers) == 'function') {
		initPickers();
	}
});
