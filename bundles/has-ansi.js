var ansiRegex = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
};

var re = new RegExp(ansiRegex().source); // remove the `g` flag
var hasAnsi = re.test.bind(re);
