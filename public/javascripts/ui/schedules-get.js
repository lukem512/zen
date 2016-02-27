var getApiUrl = '/api/schedules/list/owner/';

var get = function() {
	_get(getApiUrl + user, function(schedules){
		// TODO
		console.log(schedules)
		
	});
};

$(function() {
	get();
});
