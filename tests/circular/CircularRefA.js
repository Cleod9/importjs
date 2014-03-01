ImportJS.pack('tests.circular.CircularRefA', function(module) {
	//Circular reference test, we will unpack at the bottom of the code instead of the top
	var CircularRefB;

	function CircularRefA() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularRefA";
		}
	}
	
	//We can utilize CircularRefB since it gets hoisted up later
	CircularRefA.prototype.getCircRefB = function() {
		var circRefB = new CircularRefB();
		return circRefB.toString();
	}
	
	//Expose CircularRefA and set up postCompile() to hoist up the reference to CircularRefB
	module.exports = CircularRefA, 
	module.postCompile = function() { 
		//Import all the items you want below
		CircularRefB = ImportJS.unpack('tests.circular.CircularRefB');
	}
});