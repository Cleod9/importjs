ImportJS.pack('inheritance.Parent', function(module) {
	//Parent object test
	function Parent() {
		this.sharedValue = 42;
		this.foo = function() {
			return 'I am parent. My sharedValue is ' + this.sharedValue;
		}
	}
	
	//Expose Parent via module.exports
	module.exports = Parent;
	module.postCompile = function() { 
		//Import additional packages you want here, but of course first create the corresponding variable references in the outer scope
	};
});