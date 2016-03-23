var calendarApiUrl = '/api/calendar';

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH-mm';

var _isMoment = function(obj){
	return (obj && obj.isValid && obj.isValid());
};

var newDateUrl = function(base, start, end) {
	// Check the start date is valid.
	// Use today if it is not.
	if (!_isMoment(start)) {
		start = moment(start, dateFormat);
		if (!start.isValid())
			start = moment(start);
	}

	var url = base + '?date=' + start.format(dateFormat);

	// Add a start time, if specified
	if (start.format(timeFormat) != '00-00') {
		url += '&time=' + start.format(timeFormat);
	}

	// Add an end date/time if specified
	if (_isMoment(end)) {
		url += '&enddate=' + end.format(dateFormat);

		if (end.format(timeFormat) != '00-00') {
			url += '&endtime=' + end.format(timeFormat);
		}
	}

	return  url;
};

var nakedUrl = function() {
	return '/' + dictionary.schedule.noun.plural;
};

var calendarUrl = function(date, view) {
	return newDateUrl(nakedUrl(), date) + '&view=' + view;
};

var newScheduleUrl = function(start, end, title, description) {
	var url = newDateUrl(nakedUrl() + '/new', start, end);

	if (title) {
		url += '&title=' + encodeURIComponent(title);
	}

	if (description) {
		url += '&description=' + encodeURIComponent(description);
	}

	return  url;
};
