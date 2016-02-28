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

var _get = function(getApiUrl, callback) {
	$.ajax({
	    url: getApiUrl,
	    type: 'GET',
	    success: callback,
	    error: function(e) {
	    	alert(JSON.stringify(e));
	    }
	});
};

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

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return (results) ? results[1] || 0 : null;
}
