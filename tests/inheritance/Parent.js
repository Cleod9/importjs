ImportJS.pack('inheritance.Parent', function(module) {
  this.inject(function () { 
    //Import additional packages you want here, but of course first create the corresponding variable references in the outer scope
  });
	//Parent object test
	function Parent() {
		this.inheritedValue = 42;
		this.foo = function() {
			return 'I am parent. My inheritedValue is ' + this.inheritedValue;
		}
	}
	
	//Expose Parent via module.exports
	module.exports = Parent;
});