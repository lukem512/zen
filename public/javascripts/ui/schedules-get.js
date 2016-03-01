var calendarApiUrl = '/api/calendar';

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH-mm';

var nakedUrl = function() {
	return window.location = location.protocol + '//' + location.host + location.pathname;
};

var calendarUrl = function(date, view) {
	if (!moment(date, dateFormat).isValid())
		date = moment(date).format(dateFormat);
	return nakedUrl() + '?date=' + date + '&view=' + view;
};

var newScheduleUrl = function(date, view) {
	if (!moment(date, dateFormat).isValid())
		date = moment(date);
	return nakedUrl() + '/new?date=' + date.format(dateFormat) + '&time=' + date.format(timeFormat);
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
					window.location = newScheduleUrl(date);
				}
			},
        	_today: {
	            text: 'Today',
	            click: function() {
	            	// Go to the default calendar page
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
        	right: '_new _today _prev,_next'
    	},
		defaultView: view,
		defaultDate: date,	
		events: calendarApiUrl,
		selectable: false,
		nowIndicator: true,
		eventBorderColor: 'rgba(0,0,0,0)',
		timeFormat: 'HH:mm',
		select: function(start, end, evt) {
			// TODO - show a '+' popup
		},
		unselect: function(view, evt) {
			// TODO - hide the '+' popup
		},
        dayClick: function(day) {
	        // TODO - display button for returning to month view
	        if (view == 'agendaDay') {
	        	console.log(day)
	        	// Go to the new schedule page
				window.location = newScheduleUrl(moment(day));
	        }
	        else {
	        	// Go to day view for the selected date
	        	window.location = calendarUrl(moment(day).format(dateFormat), 'day');
	        }
	    }
    });
});
