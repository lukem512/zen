var addApiUrl = '/api/groups/new'
var updateApiUrl = '/api/groups/update';
var listViewUrl = '/admin/groups/list';

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    });
};

var add = function() {
	if (validate()){
		var params = {
			"name": $('#inputGroupName').val(),
			"description": $('#inputGroupDescription').val()
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var update = function() {
	if (validate()) {
		var params = {
			"id": $('#groupId').text(),
			"name": $('#inputGroupName').val(),
			"description": $('#inputGroupDescription').val()
		};
		_update(updateApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#inputGroupName').val());
};
