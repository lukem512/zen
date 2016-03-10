var calendarApiUrl = '/api/calendar';

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH-mm';

var nakedUrl = function() {
	return location.protocol + '//' + location.host + location.pathname;
};

var calendarUrl = function(date, view) {
	if (!moment(date, dateFormat).isValid())
		date = moment(date).format(dateFormat);
	return nakedUrl() + '?date=' + date + '&view=' + view;
};

var newScheduleUrl = function(date, view) {
	if (!moment(date, dateFormat).isValid())
		date = moment(date);

	var url = nakedUrl() + '/new?date=' + date.format(dateFormat);

	if (date.format(timeFormat) != '00-00')
		url += '&time=' + date.format(timeFormat);

	return  url;
};

$(function() {
	// Retrieve the date to display
	var date = moment($.urlParam('date'), dateFormat);
	if (!date.isValid())
		date = moment();

	// Retrieve the view
	var view = $.urlParam('view') || 'month';

	// Replace inaccurate view descriptors with correct ones
	if (view.indexOf('day') > -1) view = 'agendaDay';
	if (view.indexOf('month') > -1) view = 'month';

	$('#calendar').fullCalendar({
		customButtons: {
			_new: {
				text: 'New',
				click: function() {
					// Go to new schedule page
					date = $('#calendar').fullCalendar('getDate');

					// Use today if the current day is in the past
					if (date < new moment()) {
						date = new moment();
					}

					window.location = newScheduleUrl(date);
				}
			},
        	_today: {
	            text: 'Today',
	            click: function() {
	            	// Go to the today in day
	                window.location = calendarUrl(moment().format(dateFormat), 'agendaDay');
	            }
	        },
	        _month: {
	            text: 'Month',
	            click: function() {
	            	// Go to default calendar view
	                window.location = nakedUrl();
	            }
	        },
	        _prev: {
				text: '<',
	            click: function() {
	            	// Go back one step
	            	date = $('#calendar').fullCalendar('getDate');
	            	switch (view) {
	            		case 'agendaDay':
	            			date = date.subtract(1, 'days');
	            		break;

	            		case 'month':
	            		default:
	            			date = date.subtract(1, 'months');
	            		break;
	            	}
	                window.location = calendarUrl(date.format(dateFormat), view);
	            }
	        },
	        _next: {
				text: '>',
	            click: function() {
	            	// Go forwards one step
	            	date = $('#calendar').fullCalendar('getDate');
	            	switch (view) {
	            		case 'agendaDay':
	            			date = date.add(1, 'days');
	            		break;

	            		case 'month':
	            		default:
	            			date = date.add(1, 'months');
	            		break;
	            	}
	                window.location = calendarUrl(date.format(dateFormat), view);
	            }
	        }
    	},
    	header: {
    		left: 'title',
        	center: '',
        	right: '_new _today _month _prev,_next'
    	},
		defaultView: view,
		defaultDate: date,	
		events: calendarApiUrl,
		eventAfterAllRender: function(view) {
			// TODO - make the title a link!
			var titleSelector = '.fc-left h2';

			// Go to month view
			date = $('#calendar').fullCalendar('getDate')
			var link = calendarUrl(moment(date).format(dateFormat), 'month');

			// Make the HTML
			$(titleSelector).html('<a href="'+link+'">' + $(titleSelector).text() + '</a>');
		},
		eventMouseover: function(event, jsEvent, view) {
			// TODO - show tooltip with author, pledged users, etc.
		},
		eventMouseout: function(event, jsEvent, view) {
			// TODO - hide tooltip
		},
		nowIndicator: true,
		eventBorderColor: 'rgba(0,0,0,0)',
		timeFormat: 'HH:mm',
		selectable: false,
		select: function(start, end, evt) {
			// TODO - show a '+' popup
		},
		unselect: function(view, evt) {
			// TODO - hide the '+' popup
		},
        dayClick: function(day) {
	        if (view == 'agendaDay') {
	        	// Only do this for today and in the future
	        	if (day >= new moment()) {
		        	// Go to the new schedule page
					window.location = newScheduleUrl(moment(day));
				}
	        }
	        else {
	        	// Go to day view for the selected date
	        	window.location = calendarUrl(moment(day).format(dateFormat), 'day');
	       	}
	    }
    });
});
