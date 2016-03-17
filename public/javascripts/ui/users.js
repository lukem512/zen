// User page functionality

var feedApiUrl = '/api/feed';

// Refresh every 60 seconds
var refreshTimeInterval = 60;

// Initially get 3 days of feed
var fromTime = new Date();
fromTime.setDate(fromTime.getDate() - 3);

var getIcon = function(feedItem) {
	switch(feedItem.type) {
		case 'schedule':
			return 'fa-calendar-plus-o';

		case 'pledge':
			return 'fa-calendar-check-o';

		case 'fulfilment':
			return 'fa-hourglass-half';

		default:
			return 'fa-question';
		break;
	}
}

var displayFeed = function(feedArray) {
	var html = '';
	if (feedArray.length > 0)
		feedArray.forEach(function(f) {
			html = html + 
				'<article class=\"well well-sm feed-item col-xs-12\">' +
				'<p class=\"col-xs-12 col-sm-10\">' +
				'<span class=\"col-xs-12 col-sm-1 text-center vcenter\"><i class=\" fa ' + getIcon(f) + '\" /></span>' +
				'<span class=\"col-xs-12 col-sm-11\">' + f.html + '</span>' +
				'</p>' +
				'<p class=\"col-xs-12 col-sm-2 small text-right text-primary\">' + moment(f.createdAt).calendar() + '</p>' +
				'</article>';
		});
	else
		html = '<em>Nothing to see here yet!</em>';

	$('#feed').fadeOut(function(){
		$('#feed').html(html).fadeIn();
	});
};

var getFeed = function(username) {
	var url = feedApiUrl;

	if (username)
		url = url + '/user/' + username;

	url = url + '/from/' + fromTime;

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
		$('#message').html('We are unable to refresh the feed. Please check your Internet connection or try again later.');
		$('#message').addClass('text-danger').removeClass('hidden');
		console.error(err);
	});
};
