var calendarApiUrl = '/api/calendar';

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH-mm';

// Is the object a moment?
var _isMoment = function(obj){
	return (obj && obj.isValid && obj.isValid());
}

var nakedUrl = function() {
	return '/' + dictionary.schedule.noun.plural;
};

var calendarUrl = function(date, view) {
	if (!_isMoment(date)) {
		if (!moment(date, dateFormat).isValid()) {
			date = moment(date).format(dateFormat);
		}
	}

	return nakedUrl() + '?date=' + date + '&view=' + view;
};

var newScheduleUrl = function(start, end, title, description) {
	// Check the start date is valid.
	// Use today if it is not.
	console.log(_isMoment(start))
	if (!_isMoment(start)) {
		if (!moment(start, dateFormat).isValid())
			start = moment(start);
	}

	var url = nakedUrl() + '/new?date=' + start.format(dateFormat);

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

	if (title) {
		url += '&title=' + encodeURIComponent(title);
	}

	if (description) {
		url += '&description=' + encodeURIComponent(description);
	}

	return  url;
};
