ImportJS.pack('circular.CircularDepB', function(module) {
	//Circular dependency test, we will unpack at the bottom of the code instead of the top
	var CircularDepA;
  this.inject(function() {
    //Import all the items you want below
    CircularDepA = ImportJS.unpack('circular.CircularDepA');
  });
	
	function CircularDepB() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularDepB";
		}
	}
	
	//We can utilize CircularDepA since it gets hoisted up later
	CircularDepB.prototype.getCircDepA = function() {
		return new CircularDepA().toString();
	}
	
	//Expose CircularDepB and set up postCompile() to hoist up the reference to CircularDepA
	module.exports = CircularDepB;
});