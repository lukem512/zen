var updateApiUrl = '/admin/schedules/update';
var listApiUrl = '/admin/schedules/list';

var update = function() {
	var params = {
		"id": $('#scheduleId').text(),
		"title": $('#inputTitle').val(),
		"description": $('#inputDescription').val(),
		"start_time": $('#inputStartTime').val(),
		"end_time": $('#inputEndTime').val()
	};
	_update(updateApiUrl, listApiUrl, params);
};

var del = function() {
	_del(updateApiUrl, listApiUrl, $('#scheduleId').text());
};
