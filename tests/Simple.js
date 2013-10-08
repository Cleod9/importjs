ImportJS.pack('tests.Simple', function() {
	//Basic "class" with no dependencies
	
	//Note: You could also just return the function, however it's easier for the class to statically reference itself within this way
	function Simple() {
		/* Definition here */
		this.toString = function() {
			return "I am Simple class.";
		};
	}
	
	return Simple;
});