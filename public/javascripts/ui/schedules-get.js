var calendarApiUrl = '/api/calendar';

$(function() {
	// TODO - display based upon URL variables
	// &date=XXX
	// &view=day or &view=month

	$('#calendar').fullCalendar({
		buttonText: {
		    today:    'Today',
		    month:    'Month',
		    week:     'Week',
		    day:      'Day'
		},
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
	        $('#calendar').fullCalendar('gotoDate', day);
	        $('#calendar').fullCalendar('changeView', 'agendaDay');
	    }
    });
});
