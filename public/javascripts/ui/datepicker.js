// Set up date/timepicker components

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH:mm';

var _setAhead = function(minutes) {
	minutes = minutes || 15;
	var startTime = new Date($('#inputStartTime').timepicker('getTime'));
	$('#inputEndTime').timepicker('setTime', new Date(startTime.getTime() + minutes * 60000));
};

var initPickers = function(past) {
	var dateSet = false;

	var dateParams = {
		dateFormat: 'dd-mm-yy',
	};

	past = past || false;
	if (past) {
		dateParams.maxDate = 0;
	} else {
		dateParams.minDate = 0;
	}

	$('#inputEndDate').datepicker(dateParams);

	dateParams.onClose = function(date) {
		if (date == "") {
			return;
		}

		if (!dateSet) {
			// Don't change if the end date has already been set
			var endDate = $('#inputEndDate').datepicker('getDate', date);
			if (!endDate) {
				$('#inputEndDate').datepicker('setDate', date);
			}
			dateSet = true;
		}

    	$('#inputEndDate').datepicker('option','minDate', date);
    };

	$('#inputStartDate').datepicker(dateParams);

	if ($.urlParam('date')) {
		$('#inputStartDate').datepicker('setDate', $.urlParam('date'));
		$('#inputEndDate').datepicker('setDate', $.urlParam('date'));
	}

	if ($.urlParam('enddate')) {
		$('#inputEndDate').datepicker('setDate', $.urlParam('enddate'));
	}

	var timeParams = {
		scrollDefault: 'now',
		timeFormat: 'H:i',
		step: 5
	};
	$('#inputStartTime').timepicker(timeParams);
	$('#inputEndTime').timepicker(timeParams);

	$('#inputStartTime').on('changeTime', function(){
		var startTime = $('#inputStartTime').timepicker('getTime');
		var endTime = $('#inputEndTime').timepicker('getTime');
		if (moment(startTime).isAfter(endTime)) {
			_setAhead();
		}
	});

	$('#inputEndTime').on('changeTime', function(){
		var startTime = $('#inputStartTime').timepicker('getTime');
		var endTime = $('#inputEndTime').timepicker('getTime');
		if (moment(startTime).isAfter(endTime)) {
			_message('The end time must be after the start time.', true);
			_setAhead();
		}
	});

	if ($.urlParam('time')) {
		$('#inputStartTime').timepicker('setTime', $.urlParam('time'));
	}

	if ($.urlParam('endtime')) {
		$('#inputEndTime').timepicker('setTime', $.urlParam('endtime'));
	}

	var timeSet = false;
	$('#inputStartTime').on('selectTime', function() {
	    if (!timeSet) {
	    	// Don't change if the end time has already been set
	    	var endTime = $('#inputEndTime').timepicker('getTime');
	    	if (!endTime){
	    		var startTime = new Date($(this).timepicker('getTime'));
	    		$('#inputEndTime').timepicker('setTime', new Date(startTime.getTime() + 15 * 60000));
	    	}
	    	timeSet = true;
	    }
	});
};

// Combine the values to make a date

var makeDates = function() {
	var startDateString = $('#inputStartDate').val() + ' ' + $('#inputStartTime').val();
	var startDate = moment(startDateString, dateFormat + ' ' + timeFormat);

	var endDateString = $('#inputEndDate').val() + ' ' + $('#inputEndTime').val();
	var endDate = moment(endDateString, dateFormat + ' ' + timeFormat);

	return {
		start: startDate,
		end: endDate
	};
};
