var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';
var listViewUrl = '/admin/schedules/list';

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    })
};

var add = function() {
	if (validate()){
		var params = {
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val(),
			"owner": $('#inputOwner').find(":selected").text()
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var update = function() {
	if (validate()){
		var params = {
			"id": $('#scheduleId').text(),
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val()
		};
		_update(updateApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#scheduleId').text());
};
