var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';
var listViewUrl = '/admin/schedules/list';

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    })
};

var makeDates = function() {
	var startDateString = $('#inputStartDate').val() + ' ' + $('#inputStartTime').val();
	var startDate = moment(startDateString, 'DD-MM-YYYY HH:mm');

	var endDateString = $('#inputEndDate').val() + ' ' + $('#inputEndTime').val();
	var endDate = moment(endDateString, 'DD-MM-YYYY HH:mm');

	return {
		start: startDate,
		end: endDate
	};
}

var add = function(next) {
	var next = next || listViewUrl;
	var dates = makeDates();
	if (validate() && dates.start.isValid() && dates.end.isValid()){
		var params = {
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"owner": $('#inputOwner').find(":selected").text() || $('#inputOwner').val()
		};
		console.log(params);
		_update(addApiUrl, next, params);
	}
};

var update = function(next) {
	var next = next || listViewUrl;
	var dates = makeDates();
	if (validate() && dates.start.isValid() && dates.end.isValid()){
		var params = {
			"id": $('#scheduleId').text(),
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": dates.start.format(),
			"end_time": dates.end.format(),
			"owner": $('#inputOwner').find(":selected").text() || $('#inputOwner').val()
		};
		_update(updateApiUrl, next, params);
	}
};

var del = function(next, id) {
	var next = next || listViewUrl;
	var id = id || $('#scheduleId').text();
	console.log('DELETE schedule with ID ' + id)
	_del(updateApiUrl, next, id);
};

// Set up date/timepicker components
$(function() {
	var dateSet = false;

	var dateParams = {
		minDate: 0,
		dateFormat: 'dd-mm-yy',
		onClose: function(date) {
			if (!dateSet) {
				// Don't change if the end date has already been set
				var endDate = $('#inputEndDate').datepicker('getDate', date);
				if (!endDate) {
					$('#inputEndDate').datepicker('setDate', date);
				}
				dateSet = true;
			}
	    	$('#inputEndDate').datepicker('option','minDate', date);
	    }
	};
	$('#inputStartDate').datepicker(dateParams);

	dateParams = {
		minDate: 0,
		dateFormat: 'dd-mm-yy'
	};
	$('#inputEndDate').datepicker(dateParams);

	var timeParams = {
		scrollDefault: 'now',
		timeFormat: 'H:i',
		step: 15
	};
	$('#inputStartTime').timepicker(timeParams);
	$('#inputEndTime').timepicker(timeParams);

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
});
