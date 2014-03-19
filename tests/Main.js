ImportJS.pack('Main', function(module) {
  function print(str) {
    document.getElementById('output').innerHTML += str.split('\n').join('<br />') + "<br />";
  }

  //Internal Project dependencies
	var Parent = this.import('inheritance.Parent');
	var Child = this.import('inheritance.Child');
	var CircularRefA = this.import('circular.CircularRefA');
	var CircularRefB = this.import('circular.CircularRefB');
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
		var myCircRefA = new CircularRefA();
		var myCircRefB = new CircularRefB();
		var mySimpleClass = new Simple();

		print("\n<b>Begin preloaded test...</b>\n");
    
		print("Value of myParentClass.foo() = " + myParentClass.foo() + "\n");
		print("Value of myChildClass.foo() = " + myChildClass.foo() + "\n");
		print("Value of myParentClass.sharedValue = " + myParentClass.sharedValue + "\n");
		print("Value of myChildClass.sharedValue = " + myChildClass.sharedValue + "\n");
		print("Value of myCircRefA.toString() = " + myCircRefA.toString() + "\n");
		print("Value of myCircRefB.toString() = " + myCircRefB.toString() + "\n");
		print("Value of myCircRefA.getCircRefB() = " + myCircRefB.toString() + "\n");
		print("Value of myCircRefB.getCircRefA() = " + myCircRefA.toString() + "\n");
		print("Value of mySimpleClass.toString() = " + mySimpleClass.toString() + "\n");
		

		print("Backbone: " + Backbone.VERSION);
		print("Underscore: " + Backbone._.VERSION + " (Backbone's embedded version of it)");
		print("jQuery version: " + $.fn.jquery);
	};
	
	//This package will return Simple when unpacked
	module.exports = Main;
});