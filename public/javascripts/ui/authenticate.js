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
	    	window.location = nextUrl;
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

$(document).ready(function(){

	// Default next url to redirect to
	var defaultNextUrl = '/';

	// Retrieve the next URL
	var nextUrl = $.urlParam('r') || defaultNextUrl;

	console.log(nextUrl);

	// Create a temporary a element to decode URI
	var l = document.createElement("a");
    l.href = nextUrl;

    // Remove any hosts other than this one
    console.log(l.hostname)
    console.log(location.host)
    console.log(l.port)
    var testStr = l.port ? (l.hostname + ':' + l.port) : l.hostname;
    if (testStr !== location.host) {
    	console.log('Fail at host')
    	nextUrl = defaultNextUrl;
    }

    // Remove any protocol other than http(s)
    if (l.protocol !== "http:" && l.protocol !== "https:") {
    	console.log('Fail at protocol')
    	nextUrl = defaultNextUrl;
    }

	// Remove any programming characters
	nextUrl = nextUrl.replace(/[!'{}()*;]/g, '*');

	console.log(nextUrl);

	// Is the user already auth'd?
	// if (user) {
	// 	window.location = nextUrl;
	// }
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
