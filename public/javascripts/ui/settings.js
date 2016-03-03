var updateApiUrl = '/api/users/update';

// Form validator

var validate = function() {
    return _validate(function(){
        // TODO

        // Check old password is valid!

        // Check new password fulfils length criteria
        
        return true;
    })
};

var update = function(next) {
	var next = next || '/';
	if (validate()){
		var params = {
			"id": $('#userId').val(),
			"username": user,
			"userpass": $('#inputNewPass').val()
		};
		console.log(params)
		_update(updateApiUrl, next, params);
	}
};
