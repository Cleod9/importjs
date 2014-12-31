ImportJS.pack('Main', function(module) {
  function print(str) {
    document.getElementById('output').innerHTML += str.split('\n').join('<br />') + "<br />";
  }

  //Internal Project dependencies
	var Parent = this.import('inheritance.Parent');
	var Child = this.import('inheritance.Child');
	var CircularDepA = this.import('circular.CircularDepA');
	var CircularDepB = this.import('circular.CircularDepB');
	var Simple = this.import('Simple');

  //External Plugins
	var Backbone = this.plugin('backbone');
	var $ = this.plugin('jquery');
	
	//Note: You could also just immediately set module.exports to this function, doesn't matter when it gets set
	var Main = function () {
		/* Definition here */
		print('Created Main')

		//Ready callback
		
		var myParentClass = new Parent();
		var myChildClass = new Child();
		var myCircDepA = new CircularDepA();
		var myCircDepB = new CircularDepB();
		var mySimpleClass = new Simple();

		print("\n<b>Begin preloaded test...</b>\n");
    
		print("Value of myParentClass.foo() = " + myParentClass.foo() + "\n");
		print("Value of myChildClass.foo() = " + myChildClass.foo() + "\n");
		print("Value of myParentClass.sharedValue = " + myParentClass.sharedValue + "\n");
		print("Value of myChildClass.sharedValue = " + myChildClass.sharedValue + "\n");
		print("Value of myCircDepA.toString() = " + myCircDepA.toString() + "\n");
		print("Value of myCircDepB.toString() = " + myCircDepB.toString() + "\n");
		print("Value of myCircDepA.getCircDepB() = " + myCircDepA.getCircDepB().toString() + "\n");
		print("Value of myCircDepB.getCircDepA() = " + myCircDepB.getCircDepA().toString() + "\n");
		print("Value of mySimpleClass.toString() = " + mySimpleClass.toString() + "\n");
		

		print("Backbone: " + Backbone.VERSION);
		print("Underscore: " + Backbone._.VERSION + " (Backbone's embedded version of it)");
		print("jQuery version: " + $.fn.jquery);
	};
	
	//This package will return Simple when unpacked
	module.exports = Main;
});