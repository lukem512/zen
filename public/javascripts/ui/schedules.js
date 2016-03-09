var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';

var newPledgeApiUrl = '/api/pledges/new';
var updatePledgeApiUrl = '/api/pledges/update';
var getPledgesApiUrl = '/api/pledges/users';

var listViewUrl = '/admin/schedules/list';

// Form validator

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    })
};

// Pledge functions

var pledgedUsers = function(id, callback) {
	_get(getPledgesApiUrl + '/' + id, callback);
};

var join = function(id) {
	var params = {
		username: user,
		schedule: id
	};
	_post(newPledgeApiUrl, params, function() {
		location.reload(true);
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

$(function() {
	var id = $('#id').val();
	var future = !($('#future').is(':checked'));
	if (id) {
		pledgedUsers(id, function(users){

			// Did you pledge?
			var you = false;

			// Build pledge string
			var html = (users.length) ? "" : "Nobody";
			for (var i = 0; i < users.length; i++) {
				if (i == users.length - 1 && users.length > 1) {
					html += " and ";
				}
				else if (i < users.length - 1) {
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
			if (future) {
				if (users.length > 1 || you) {
					html += " have";
				}
				else {
					html += " has"; 
				}
			}
			html += " pledged to attend.";
			$('#pledges').html(html);

			// Change button state
			if (you) {
				$('#btnJoin').addClass('hidden');
				$('#btnLeave').removeClass('hidden');
			}
		});
	}
});
