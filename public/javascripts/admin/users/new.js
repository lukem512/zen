var validate() = function() {
	var validated = true;

	// TODO

	if(validated){
		$('#inputUserPass').val(
			_hash($('#inputUserPass').val(), 10)
		);
        document.form.submit();
        return true;
    }
    else {
    	return false;
    }
}
