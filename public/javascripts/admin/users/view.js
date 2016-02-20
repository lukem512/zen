var updateApiUrl = '/admin/users/update';
var listApiUrl = '/admin/users/list';

var update = function() {
	var groupsArray = $('input[type=checkbox]:checked').map(function(_, el) {
	    return $(el).val();
	}).get();
	var params = {
		"id": $('#userId').text(),
		"username": $('#inputUserName').val(),
		"useremail": $('#inputUserEmail').val(),	
		"userpass": _hash($('#inputUserPass').val()),
		"usergroups": groupsArray
	};
	_update(updateApiUrl, listApiUrl, params);
};

var del = function() {
	_del(updateApiUrl, listApiUrl, $('#inputUserName').val());
};
