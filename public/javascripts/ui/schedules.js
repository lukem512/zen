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
        // TODO
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
			"owner": owner
		};
		_update(addApiUrl, next, params);
	}
};

var update = function(next, id) {
	var next = next || listViewUrl;
	var dates = makeDates();
	var id = id || $('#scheduleId').text();
	var owner = $('#inputOwner').find(":selected").text() || $('#inputOwner').val();
	if (validate() && dates.start.isValid() && dates.end.isValid()){
		var params = {
			"id": id,
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"owner": owner
		};
		_update(updateApiUrl, next, params);
	}
};

var del = function(next, id) {
	var next = next || listViewUrl;
	var id = id || $('#scheduleId').text();
	_del(updateApiUrl, next, id);
};

var listUsers = function(users) {
	// Did you pledge?
	var you = false;

	var html = "";
	for (var i = 0; i < users.length; i++) {
		if (i == users.length - 1 && users.length > 1) {
			html += " and ";
		}
		else if (i < users.length - 1 && i > 0) {
			html += ", ";
		}
		else {
			html += " ";
		}

		var username = users[i];
		if (users[i] == user) {
			you = true;
			username = "you"
		}

		html += "<a href=\"/users/" + users[i] + "\">";
		if (i == 0) {
			html += "<span class=\'text-capitalize\'>" + username + "</span>";
		}
		else {
			html += username;
		}
		html += "</a>";
	}
	return { html: html, you: you };
}

var displayPledgesFuture = function(users) {

	var list = listUsers(users);

	var html =
		((users.length) ? "" : "Nobody") +
		list.html +
		((users.length > 1 || list.you) ? " have " : " has ") +
		dictionary.pledge.verb.past +
		" to attend.";

	$('#pledges').html(html);

	// Change button state
	if (list.you) {
		$('#btnJoin').addClass('hidden');
		$('#btnLeave').removeClass('hidden');
	}
};

var displayPledgesPast = function(absent, present) {
	var html = "";

	if (present.length > 0) {
		var list = listUsers(present);
		html =
			html +
			list.html +
			" " + 
			dictionary.fulfilment.verb.past +
			((present.length > 1 || list.you) ? " your " : " their ") +
			dictionary.pledge.verb.past +
			" to attend.";
	}

	if (absent.length > 0) {
		var list = listUsers(absent);
		html =
			html +
			((html.length > 0) ? " " : "") +
			list.html +
			" did not attend this " + 
			dictionary.schedule.noun.singular +
			".";
	}

	$('#pledges').html(html);
};

$(function() {
	var __id = __id || false;
	if (__id) {
		var future = !(__past);
		pledgedUsers(id, function(pledged) {
			if (future) {
				displayPledgesFuture(pledged);
			} else {
				fulfilledUsers(__id, function(fulfilled) {
					var absent = pledged.filter(function(i) {return fulfilled.indexOf(i) < 0;});
					displayPledgesPast(absent, fulfilled);
				});
			}
		});
	}
});

$(function() {
	if (typeof(initPickers) == 'function') {
		initPickers();
	}
});
