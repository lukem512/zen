var bcrypt = dcodeIO.bcrypt;

var _hash = function(plaintext) {
	return bcrypt.hashSync(plaintext, 10);
};
