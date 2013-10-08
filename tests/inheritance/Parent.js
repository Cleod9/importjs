ImportJS.pack('tests.inheritance.Parent', function() {
	//Parent object test
	
	function Parent() {
		this.sharedValue = 42;
		this.foo = function() {
			return 'I am parent. My sharedValue is ' + this.sharedValue;
		}
	}
	//Set up array with [0] being a reference to the class definition, and [1] a function that ImportJS will call when ImportJS.compile() is called
	return [Parent, function() { 
		//Import additional items you want here, but of course first create the corresponding variable references in the outer scope
	}];
}, false); //Pass a false parameter for uncompiled packages