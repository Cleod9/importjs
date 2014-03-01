ImportJS.pack('tests.circular.CircularRefB', function(module) {
	//Circular reference test, we will unpack at the bottom of the code instead of the top
	var CircularRefA;
	
	function CircularRefB() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularRefB";
		}
	}
	
	//We can utilize CircularRefA since it gets hoisted up later
	CircularRefB.prototype.getCircRefA = function() {
		var circRefA = new CircularRefA();
		return circRefA.toString();
	}
	
	//Expose CircularRefB and set up postCompile() to hoist up the reference to CircularRefA
	module.exports = CircularRefB, 
	module.postCompile = function() {
		//Import all the items you want below
		CircularRefA = ImportJS.unpack('tests.circular.CircularRefA');
	}
});