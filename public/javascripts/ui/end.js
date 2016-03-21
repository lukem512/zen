// Authentication handler
// This removes the authorisation token cookie, signing out the user.

var end = function() {
	_post('/api/end', null, function(res) {
		// Remove the cookie to log out!
		$.removeCookie("token");

		// Redirect to main page
		window.location = '/';
	}, function(e) {
    	// Display an error message
    	if (e.responseJSON && e.responseJSON.message) {
    		_message(e.responseJSON.message, true);
    	}
    	else {
    		console.error(e);
    		_message('An error occurred whilst logging out.', true);
    	}
    });
};
