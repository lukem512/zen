// Set up date/timepicker components

var dateFormat = 'DD-MM-YYYY';
var timeFormat = 'HH:mm';

var initPickers = function(past) {
	var dateSet = false;

	past = past || false;

	var dateParams = {
		dateFormat: 'dd-mm-yy',
	};

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
		console.log(date)

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

	var timeParams = {
		scrollDefault: 'now',
		timeFormat: 'H:i',
		step: 15
	};
	$('#inputStartTime').timepicker(timeParams);
	$('#inputEndTime').timepicker(timeParams);

	$('#inputStartTime').on('changeTime', function(){
		// TODO - if the time is ahead of endTime, remove value of endTime
	});

	$('#inputEndTime').on('changeTime', function(){
		// TODO - if the time is before startTime, show an error
	});

	if ($.urlParam('time')) {
		$('#inputStartTime').timepicker('setTime', $.urlParam('time'));
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
