var addApiUrl = '/api/pledges/new';
var updateApiUrl = '/api/pledges/update';
var listViewUrl = '/admin/pledges/list';

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    })
};

var add = function() {
	if (validate()) {
		var params = {
			"username": $('#inputUsername').val(),
			"schedule": $('#inputSchedule').val(),
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#pledgeId').text());
};
