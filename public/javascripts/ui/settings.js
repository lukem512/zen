var updateApiUrl = '/api/users/update';

// Form validator

var validate = function() {
    return _validate(function(){
    	var result = true;

        // Check old password is valid!
        $.ajax({
		    url: '/api/authenticate',
		    data: {
				"username": user,
				"password": $('#inputOldPass').val()
			},
		    type: 'POST',
		    async: false
		}).error(function(e) {
			if (e.responseJSON.message) {
				message(e.responseJSON.message, true);
	    	}
	    	else {
	    		message('An error occurred whilst changing your settings.', true);
	    	}
	    	result = false;
		});

        // Check new password fulfils length criteria
        // TODO
        
        return result;
    })
};

var message = function(text, isError) {
	var el = $('#message');
	var isError = isError || false;

	if (isError) {
		el.addClass('text-danger');
	} else {
		el.removeClass('text-danger');
	}

	el.text(text);

	if (el.hasClass('hidden')) {
		el.removeClass('hidden');
	}
};

var update = function(next) {
	var next = next || '/';
	if (validate()){
		var params = {
			"id": $('#userId').val(),
			"username": user,
			"userpass": $('#inputNewPass').val()
		};
		_update(updateApiUrl, next, params);
	}
};
