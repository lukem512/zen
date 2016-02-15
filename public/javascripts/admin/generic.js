var _update = function(updateApiUrl, nextUrl, params) {
	console.log(params);
	$.ajax({
	    url: updateApiUrl,
	    data: params,
	    type: 'POST',
	    success: function() {
	    	window.location.href = nextUrl;
	    },
	    error: function(e) {
	    	alert(JSON.stringify(e));
	    }
	});
};

var _del = function(updateApiUrl, nextUrl, key) {
	$.ajax({
	    url: updateApiUrl + '/' + key,
	    type: 'DELETE',
	    success: function() {
	    	window.location.href = nextUrl;
	    },
	    error: function(e) {
	    	alert(JSON.stringify(e));
	    }
	});
};
