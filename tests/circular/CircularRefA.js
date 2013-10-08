ImportJS.pack('tests.circular.CircularRefA', function() {
	//Circular reference test
	var CircularRefB;

	//Note: You could also just return the function, however it's easier for the class to statically reference itself within this way
	function CircularRefA() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularRefA";
		}
	}
	//Set up array with [0] being a reference to the class definition, and [1] a function that ImportJS will call when ImportJS.compile() is called
	return [CircularRefA, function() { 
		//Import all the items you want below
		CircularRefB = ImportJS.unpack('tests.circular.CircularRefB');

		//Because the unpacking was delayed, we can properly utilize CircularRefB
		CircularRefB.prototype.getCircRefA = function() {
			var circRefA = new CircularRefA();
			return circRefA.toString();
		}
	}];
}, false); //Pass a false parameter for uncompiled packages