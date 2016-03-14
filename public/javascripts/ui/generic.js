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

var defaultError = function(e) {
	alert('Something went wrong with your request, sorry!');
	console.error(e);
};

var _get = function(getApiUrl, callback, error) {
	$.ajax({
	    url: getApiUrl,
	    type: 'GET',
	    success: callback,
	    error: error || defaultError
	});
};

var _post = function(postApiUrl, params, callback, error) {
	$.ajax({
	    url: postApiUrl,
	    data: params,
	    type: 'POST',
	    success: callback,
	    error: error || defaultError
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
	    error: defaultError
	});
};

var _del = function(updateApiUrl, nextUrl, key) {
	if (typeof(key) == 'object') return _delPairs(updateApiUrl, nextUrl, key);

	$.ajax({
	    url: updateApiUrl + '/' + key,
	    type: 'DELETE',
	    success: function() {
	    	window.location.href = nextUrl;
	    },
	    error: defaultError
	});
};

var _delPairs = function(updateApiUrl, nextUrl, pair) {
	if (typeof(key) == 'string') return _del(updateApiUrl, nextUrl, pair);

	var url = updateApiUrl;
	$.each(pair, function(k, v) {
		url += '/' + k + '/' + v;
	});

	$.ajax({
	    url: url,
	    type: 'DELETE',
	    success: function() {
	    	window.location.href = nextUrl;
	    },
	    error: defaultError
	});
};

var _message = function(text, isError) {
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

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return (results) ? results[1] || 0 : null;
}

var listUsers = function(users, omitSelf) {
	// Is the current user present?
	var you = false;

	if (omitSelf) {
		users = users.filter(function(u) {
			return (u != user);
		});
	}

	// Make a HTML list
	var html = "";
	for (var i = 0; i < users.length; i++) {
		if (i == users.length - 1 && users.length > 1) {
			html += " and ";
		}
		else if (i < users.length - 1 && i > 0) {
			html += ", ";
		}
		else {
			html += " ";
		}

		var username = users[i];
		if (users[i] == user) {
			you = true;
			username = "you"
		}

		html += "<a href=\"/users/" + users[i] + "\">";
		if (i == 0) {
			html += "<span class=\'text-capitalize\'>" + username + "</span>";
		}
		else {
			html += username;
		}
		html += "</a>";
	}
	return { html: html, you: you, n: users.length };
};
