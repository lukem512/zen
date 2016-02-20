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

// var _add = function() {
// 	var formRegEx = new RegExp(/formAdd(.+)/);
// 	var inputRegEx = new RegExp(/input(.+)/);

// 	var elem = $('form').map(function(){
// 		return this.id.match(formRegEx)[1];
// 	});

// 	if (elem.length > 1) {
// 		console.error('Naming ambiguity. Please rename your forms so that only one formAddX exists or use a custom add() function.');
// 		return;
// 	}

// 	var name = elem[0];
// 	var addApiUrl = '/api/' + name + '/new';
// 	var nextUrl = '/admin/' + name + '/list';

// 	var inputs = $('input').filter(function(){
// 		var match = this.id.match(inputRegEx)
// 		if (match) this.name = match[1][0];
// 		return match;
// 	});

// 	var params = {};
// 	inputs.forEach(function(i){
// 		params[i.name] = i.val();
// 	});

// 	_update(addApiUrl, nextUrl, params);
// };

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
