ImportJS.pack('inheritance.Child', function(module) {
	//Child object test (Unpacking Parent will force it to compile immediately)
	var Parent = ImportJS.unpack('inheritance.Parent');
	
	function Child() { }

	Child.prototype = new Parent(); //<-trick to inheriting Parent's properties, alternatively you could clone the Parent's prototype manually
	
	//Override foo
	Child.prototype.foo = function() {
		return 'I am child. My sharedValue value is ' + this.sharedValue;
	};

	//Expose Child via module.exports
	module.exports = Child;
	module.postCompile = function() { 
		//Import additional items you want here, but of course first create the corresponding variable references in the outer scope
	};
});