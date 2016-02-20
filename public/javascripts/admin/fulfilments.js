var addApiUrl = '/api/fulfilments/new';
var updateApiUrl = '/api/fulfilments/update';
var listViewUrl = '/admin/fulfilments/list';

var validate = function() {
	return _validate(function(){
        // TODO
        return true;
    });
};

var add = function() {
	if (validate()){
		var params = {
			"username": $('#inputUsername').find(":selected").text(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val()
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var update = function() {
	if (validate()){
		var params = {
			"id": $('#fulfilmentId').text(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val()
		};
		_update(updateApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#fulfilmentId').text());
};
