// Authentication handler
// This communicates with the API to sign in the user.

var auth = function() {
	$.ajax({
	    url: '/api/authenticate',
	    data: {
			"username": $('#inputUsername').val(),
			"password": $('#inputPassword').val()
		},
	    type: 'POST',
	    success: function(res) {
	    	// Set a cookie with an expiry 1 day from now
	    	$.cookie("token", res.token, { expires: 1 });

	    	// Redirect to main page
	    	window.location = '/';
	    },
	    error: function(e) {
	    	// Display an error message
	    	if (e.responseJSON.message) {
	    		message(e.responseJSON.message, true);
	    	}
	    	else {
	    		message('An error occurred whilst logging in.', true);
	    	}
	    }
	});
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

var end = function() {
	// Remove the cookie to log out!
	$.removeCookie("token");

	console.log('Removing cookie!');

	// Redirect to main page
	window.location = '/';
};

// Submit form on 'enter' keypress
$('#formAuthenticate input').keydown(function(e) {
    if (e.keyCode == 13) {
        event.preventDefault();
        auth();
    }
});
