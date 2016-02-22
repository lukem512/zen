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
	    success: function() {
	    	alert('success!');
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
