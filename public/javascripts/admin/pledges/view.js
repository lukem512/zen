var updateApiUrl = '/admin/pledges/update';
var listApiUrl = '/admin/pledges/list';

var del = function() {
	_del(updateApiUrl, listApiUrl, $('#pledgeId').text());
};
