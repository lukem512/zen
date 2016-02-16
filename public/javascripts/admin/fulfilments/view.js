var updateApiUrl = '/admin/fulfilments/update';
var listApiUrl = '/admin/fulfilments/list';

var update = function() {
	var params = {
		"id": $('#fulfilmentId').text(),
		"start_time": $('#inputStartTime').val(),
		"end_time": $('#inputEndTime').val()
	};
	_update(updateApiUrl, listApiUrl, params);
};

var del = function() {
	_del(updateApiUrl, listApiUrl, $('#fulfilmentId').text());
};
