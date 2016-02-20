var addApiUrl = '/api/users/new';
var updateApiUrl = '/api/users/update';
var listViewUrl = '/admin/users/list';

var validate = function() {
	return _validate(function(){
        // TODO
        return true;
    }, function(){
    	// Modify the password to return the hash
    	$('#inputUserPass').val(
			_hash($('#inputUserPass').val(), 10)
		);
    })
};

var groups = function(){
	return $('input[type=checkbox]:checked').map(function(_, el) {
	    return $(el).val();
	}).get();
}

var add = function() {
	if (validate()){
		var params = {
			"username": $('#inputUserName').val(),
			"useremail": $('#inputUserEmail').val(),	
			"userpass": _hash($('#inputUserPass').val()),
			"usergroups": groups()
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var update = function() {
	if (validate()) {
		var params = {
			"id": $('#userId').text(),
			"username": $('#inputUserName').val(),
			"useremail": $('#inputUserEmail').val(),	
			"userpass": _hash($('#inputUserPass').val()),
			"usergroups": groups()
		};
		_update(updateApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#inputUserName').val());
};
