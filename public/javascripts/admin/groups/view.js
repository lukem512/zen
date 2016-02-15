var updateApiUrl = '/admin/groups/update';
var listApiUrl = '/admin/groups/list';

var update = function() {
	var params = {
		"id": $('#groupId').text(),
		"name": $('#inputGroupName').val(),
		"description": $('#inputGroupDescription').val()
	};
	_update(updateApiUrl, listApiUrl, params);
};

var del = function() {
	_update(updateApiUrl, listApiUrl, $('#inputGroupName').val());
};
