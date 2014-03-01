ImportJS.pack('tests.Simple', function(module) {
	//Basic JavaScript "class" with no dependencies
	
	//Note: You could also just immediately set module.exports to this function
	var Simple = function () {
		/* Definition here */
		this.toString = function() {
			return "I am Simple class.";
		};
	};
	
	//This package will return Simple when unpacked
	module.exports = Simple;
});