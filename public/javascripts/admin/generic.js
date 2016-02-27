var _validate = function(validator, modifier) {
	var validated = validator || function() { return true; };
	var modifier = modifier || function() { return; };
	if(validated()){
		modifier();
        return true;
    }
    else {
    	return false;
    }
}

var _update = function(updateApiUrl, nextUrl, params) {
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
