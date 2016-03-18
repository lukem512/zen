var addApiUrl = '/api/users/new';
var updateApiUrl = '/api/users/update';
var generateApiUrl = '/api/users/generate';
var listViewUrl = '/admin/users/list';

var validate = function() {
	return _validate(function(){
        // TODO
        return true;
    });
};

var groups = function(){
	return $('input[type=checkbox]:checked').map(function(_, el) {
	    return $(el).val();
	}).get();
};

var add = function() {
	if (validate()){
		var params = {
			"username": $('#inputUserName').val(),
			"userpass": $('#inputUserPass').val(),
			"usergroups": groups(),
			"admin": $('#inputAdmin').is(':checked')
		};
		_update(addApiUrl, listViewUrl, params);
	}
};

var update = function() {
	if (validate()) {
		var params = {
			"id": $('#userId').text(),
			"username": $('#inputUserName').val(),
			"usergroups": groups(),
			"admin": $('#inputAdmin').is(':checked')
		};

		if (window.__passwordChanged) {
			params.userpass = $('#inputUserPass').val();
		}

		_update(updateApiUrl, listViewUrl, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#inputUserName').val());
};

var gen = function() {
	_get(generateApiUrl, function(generated) {
		$('#inputUserName').val(generated.username);
		$('#inputUserPass').val(generated.password).addClass('hidden');
		$('#inputUserPassGen').val(generated.password).removeClass('hidden');
	})
};
