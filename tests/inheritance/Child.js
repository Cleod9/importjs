ImportJS.pack('tests.inheritance.Child', function() {

	//Child object test (Importing parent will force it to compile immediately)
	var Parent = ImportJS.unpack('tests.inheritance.Parent');
	
	function Child() {
	}

	Child.prototype = new Parent();
	
	//Override foo
	Child.prototype.foo = function() {
		return 'I am child. My sharedValue value is ' + this.sharedValue;
	};

	//Set up array with [0] being a reference to the class definition, and [1] a function that ImportJS will call when ImportJS.compile() is called
	return [Child, function() { 
		//Import additional items you want here, but of course first create the corresponding variable references in the outer scope
	}];
}, false); //Pass a false parameter for uncompiled packages