var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';

var newPledgeApiUrl = '/api/pledges/new';
var updatePledgeApiUrl = '/api/pledges/update';
var getPledgesApiUrl = '/api/pledges/users';

var listViewUrl = '/admin/schedules/list';

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH:mm';

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
	// $.ajax({
	//     url: updatePledgeApiUrl + '/schedule/' +  id + '/username/' + user,
	//     type: 'DELETE',
	//     success: function() {
	//     	window.location.href = next;
	//     },
	//     error: function(e) {
	//     	alert(JSON.stringify(e));
	//     }
	// });
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

// Helpers and UI functions

var makeDates = function() {
	var startDateString = $('#inputStartDate').val() + ' ' + $('#inputStartTime').val();
	var startDate = moment(startDateString, dateFormat + ' ' + timeFormat);

	var endDateString = $('#inputEndDate').val() + ' ' + $('#inputEndTime').val();
	var endDate = moment(endDateString, dateFormat + ' ' + timeFormat);

	return {
		start: startDate,
		end: endDate
	};
};

// Set up date/timepicker components
var initPickers = function() {
	var dateSet = false;

	var dateParams = {
		minDate: 0,
		dateFormat: 'dd-mm-yy',
		onClose: function(date) {
			if (!dateSet) {
				// Don't change if the end date has already been set
				var endDate = $('#inputEndDate').datepicker('getDate', date);
				if (!endDate) {
					$('#inputEndDate').datepicker('setDate', date);
				}
				dateSet = true;
			}
	    	$('#inputEndDate').datepicker('option','minDate', date);
	    }
	};
	$('#inputStartDate').datepicker(dateParams);

	if ($.urlParam('date'))
		$('#inputStartDate').datepicker('setDate', $.urlParam('date'));

	dateParams = {
		minDate: 0,
		dateFormat: 'dd-mm-yy'
	};
	$('#inputEndDate').datepicker(dateParams);

	var timeParams = {
		scrollDefault: 'now',
		timeFormat: 'H:i',
		step: 15
	};
	$('#inputStartTime').timepicker(timeParams);
	$('#inputEndTime').timepicker(timeParams);

	if ($.urlParam('time'))
		$('#inputStartTime').timepicker('setTime', $.urlParam('time'));

	var timeSet = false;
	$('#inputStartTime').on('selectTime', function() {
	    if (!timeSet) {
	    	// Don't change if the end time has already been set
	    	var endTime = $('#inputEndTime').timepicker('getTime');
	    	if (!endTime){
	    		var startTime = new Date($(this).timepicker('getTime'));
	    		$('#inputEndTime').timepicker('setTime', new Date(startTime.getTime() + 15 * 60000));
	    	}
	    	timeSet = true;
	    }
	});
}

$(function() {
	initPickers();

	var id = $('#id').val();
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
			if (users.length > 1 || you) {
				html += " have";
			}
			else {
				html += " has"; 
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
