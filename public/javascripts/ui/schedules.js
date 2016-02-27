var addApiUrl = '/api/schedules/new';
var updateApiUrl = '/api/schedules/update';
var listViewUrl = '/admin/schedules/list';

var validate = function() {
    return _validate(function(){
        // TODO
        return true;
    })
};

var add = function(next) {
	var next = next || listViewUrl;
	if (validate()){
		var params = {
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val(),
			"owner": $('#inputOwner').find(":selected").text() || $('#inputOwner').val()
		};
		_update(addApiUrl, next, params);
	}
};

var update = function(next) {
	var next = next || listViewUrl;
	if (validate()){
		var params = {
			"id": $('#scheduleId').text(),
			"title": $('#inputTitle').val(),
			"description": $('#inputDescription').val(),
			"start_time": $('#inputStartTime').val(),
			"end_time": $('#inputEndTime').val()
		};
		_update(updateApiUrl, next, params);
	}
};

var del = function() {
	_del(updateApiUrl, listViewUrl, $('#scheduleId').text());
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
