ImportJS.pack('tests.circular.CircularRefB', function() {
	//Circular reference test
	var CircularRefA;
	
	//Note: You could also just return the function, however it's easier for the class to statically reference itself within this way
	function CircularRefB() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularRefB";
		}
	}
	//Set up array with [0] being a reference to the class definition, and [1] a function that ImportJS will call when ImportJS.compile() is called
	return [CircularRefB, function() { 
		//Import all the items you want below
		CircularRefA = ImportJS.unpack('tests.circular.CircularRefA');

		//Because the unpacking was delayed, we can properly utilize CircularRefA
		CircularRefA.prototype.getCircRefB = function() {
			var circRefB = new CircularRefB();
			return circRefB.toString();
		}
	}];
}, false); //Pass a false parameter for uncompiled packages