var updateApiUrl = '/admin/users/update';
var listApiUrl = '/admin/users/list';

var update = function() {
	var params = {
		"id": $('#userId').text(),
		"username": $('#inputUserName').val(),
		"useremail": $('#inputUserEmail').val(),
		"userpass": _hash($('#inputUserPass').val()),
		"usergroups": {}
	};
	_update(updateApiUrl, listApiUrl, params);
};

var del = function() {
	_del(updateApiUrl, listApiUrl, $('#inputUserName').val());
};
