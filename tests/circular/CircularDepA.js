ImportJS.pack('circular.CircularDepA', function(module) {
	//Circular dependency test, we will unpack at the bottom of the code instead of the top
  var self = this;
  var CircularDepB;
  this.inject(function() { 
    //Import all the items you want below
    CircularDepB = ImportJS.unpack('circular.CircularDepB');
  });

	function CircularDepA() {
		/* Definition here */
		
		this.toString = function() {
			return "I am CircularDepA";
		}
	}
	
	//We can utilize CircularDepB since it gets hoisted up later
	CircularDepA.prototype.getCircDepB = function() {
		return new CircularDepB().toString();
	}
	
	//Expose CircularDepA and set up postCompile() to hoist up the reference to CircularDepB
	module.exports = CircularDepA;
});