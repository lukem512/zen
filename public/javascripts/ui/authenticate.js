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
