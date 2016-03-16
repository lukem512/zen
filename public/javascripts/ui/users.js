// User page functionality

var feedApiUrl = '/api/feed';

// Refresh every 60 seconds
var refreshTimeInterval = 60;

var displayFeed = function(feedArray) {
	var html = '';
	if (feedArray.length > 0)
		feedArray.forEach(function(f) {
			html = html + 
				'<p class=\"feed-item\">' +
				f.html +
				'</p>';
		});
	else
		html = '<em>Nothing to see here yet!</em'
	$('#feed').html(html);
};

var getFeed = function(username) {
	var url = feedApiUrl + '/' + username;

	_get(url, function(res) {
		if (res.message) {
			// Not authorised
			$('#message').html('Psst... you\'re not meant to be here!');
			$('#message').addClass('text-danger').removeClass('hidden');
			console.error(res.message);
		}
		else {
			displayFeed(res);
		}
	}, function(err) {
		$('#message').html('We are unable to retrieve this user\'s details. Please check your Internet connection or try again later.');
		$('#message').addClass('text-danger').removeClass('hidden');
		console.error(err);
	});
};
