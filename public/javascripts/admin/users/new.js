var validate() = function() {
	return _validate(function(){
        // TODO
        return true;
    }, function(){
    	// Modify the password to return the hash
    	$('#inputUserPass').val(
			_hash($('#inputUserPass').val(), 10)
		);
    })
}
