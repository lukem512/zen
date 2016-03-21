// Authentication handler
// This communicates with the API to sign in the user.

// Default next url to redirect to
var defaultNextUrl = '/';
var nextUrl = defaultNextUrl;

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
	    	if (!document.cookie) {
	    		console.log('Adding token cookie manually');
	    		$.cookie("token", res.token, { expires: 1 });
	    	}

	    	// Redirect to main page
	    	window.location = nextUrl;
	    },
	    error: function(e) {
	    	// Display an error message
	    	if (e.responseJSON.message) {
	    		_message(e.responseJSON.message, true);
	    	}
	    	else {
	    		console.error(e);
	    		_message('An error occurred whilst logging in.', true);
	    	}
	    }
	});
};

$(document).ready(function(){

	// Retrieve the next URL
	nextUrl = $.urlParam('r') || defaultNextUrl;

	// Create a temporary a element to decode URI
	var l = document.createElement("a");
    l.href = nextUrl;

    // Remove any hosts other than this one
    var testStr = l.port ? (l.hostname + ':' + l.port) : l.hostname;
    if (testStr !== location.host) {
    	nextUrl = defaultNextUrl;
    }

    // Remove any protocol other than http(s)
    if (l.protocol !== "http:" && l.protocol !== "https:") {
    	nextUrl = defaultNextUrl;
    }

	// Remove any programming characters
	nextUrl = nextUrl.replace(/[!'{}()*;]/g, '*');
})

$(document).keypress(function(e){
	// Capture enter event
	var keyCode = e.which || e.keyCode || 0;
    if (keyCode == 13){
        e.preventDefault();
		auth();
		return false;
    }
});
