// Authentication handler
// This removes the authorisation token cookie, signing out the user.

var end = function() {
	// Remove the cookie to log out!
	$.removeCookie("token");

	// Redirect to main page
	window.location = '/';
};

$(document).ready(function(){
	// Is the user already signed out?
	if (typeof user == 'undefined') {
		window.location = '/';
	}
});
