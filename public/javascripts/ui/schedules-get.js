var calendarApiUrl = '/api/calendar';

var nakedUrl = function() {
	return window.location = location.protocol + '//' + location.host + location.pathname;
};

var calendarUrl = function(date, view) {
	return nakedUrl() + '?date=' + moment(date).format('YYYY-MM-DD') + '&view=' + view;
};

$(function() {
	// Retrieve the date to display
	var date = $.urlParam('date') || moment();

	// Retrieve the view
	var view = $.urlParam('view') || 'month';

	// Replace inaccurate view descriptors with correct ones
	if (view.indexOf('day') > -1) view = 'agendaDay';
	if (view.indexOf('month') > -1) view = 'month';

	$('#calendar').fullCalendar({
		customButtons: {
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
	                window.location = calendarUrl(date, view);
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
	                window.location = calendarUrl(date, view);
	            }
	        }
    	},
    	header: {
    		left: 'title',
        	center: '',
        	right: '_today _prev,_next'
    	},
		defaultView: view,
		defaultDate: date,	
		events: calendarApiUrl,
		selectable: true,
		nowIndicator: true,
		select: function(start, end, evt) {
			// TODO - show a '+' popup
		},
		unselect: function(view, evt) {
			// TODO - hide the '+' popup
		},
        dayClick: function(day) {
	        // TODO - display button for returning to month view

	        // Go to day view for the selected date
	        window.location = calendarUrl(moment(day).format('YYYY-MM-DD'), 'day');
	    }
    });
});
