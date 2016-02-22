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

	    	// TODO - success message!
	    },
	    error: function(e) {
	    	alert(JSON.stringify(e));
	    }
	});
};

// Submit form on 'enter' keypress
$('#formAuthenticate input').keydown(function(e) {
	console.log('yo!');
    if (e.keyCode == 13) {
        event.preventDefault();
        auth();
    }
});
