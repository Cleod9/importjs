/*
Copyright (c) 2013 Greg McLeod  (Email: cleod9{at}gmail.com)

The below code demonstrates how to use Import.js.

*/

//Print function for testing purposes
function print(str) {
	document.getElementById('output').innerHTML += str.split('\n').join('<br />') + "<br />";
}

//Creating Packages on the fly
ImportJS.pack('com.mcleodgaming.SingletonClass', function() {
	return {
		//Note: For static classes like this, you may want to create some sort of init() if you need to use packages within
		foo: 'I am SingletonClass',
		value: function() {
			return this.foo;
		}
	}
});
ImportJS.pack('com.mcleodgaming.NormalClass', function() {
	return function() { 
		var foo = 'I am NormalClass';
		this.value = function() {
			return foo;
		}
	};
});

//Create a slightly more advanced package that utilizes the classes we just created
ImportJS.pack('com.mcleodgaming.AdvancedClass', function() {
	//Note: You could also just immediately return the function, however it's easier for the class to reference itself inside the closure this way
	var AdvancedClass = function() {
		//Import class references (other ways to do this noted below, but note we do it inside the definition so the classes can't be referenced before the page loads)
		var SingletonClass = ImportJS.unpack('com.mcleodgaming.SingletonClass'),
			NormalClass = ImportJS.unpack('com.mcleodgaming.NormalClass');

		//Now we can create these classes on command
		var classInstance = new NormalClass();

		this.getSingletonValue = function() {
			return SingletonClass.value();
		}
		this.getClassInstanceValue = function() {
			return classInstance.value();
		}
	}
	return AdvancedClass;
});

//On DOM load main() gets called
function main() {

	//How to preload files
	ImportJS.preload({
		baseUrl: '',
		//Pass as an object to describe entire package tree (Suggested to use strict parameter)
		//Note: Keys are either folder names or class names, and values are contents or file names
		files: {
			tests: {
				Simple: 'Simple.js',
				circular: {
					CircularRefA: 'CircularRefA.js',
					CircularRefB: 'CircularRefB.js'
				},
				inheritance: {
					Child: 'Child.js',
					Parent: 'Parent.js'
				}
			}
		},
		//Use list method if you want to write out file paths explicitly or if order matters
		//Note: It's recommended to turn strict parameter off if not using packaging features, package name will try default to file name minus .js suffix)
		/*files: [
			'tests/Simple.js',
			'tests/circular/CircularRefA.js',
			'tests/circular/CircularRefB.js',
			'tests/inheritance/Child.js',
			'tests/inheritance/Parent.js'
		],*/
		libs: [ 'tests/dummy.lib1.js', 'tests/dummy.lib2.js', 'tests/dummy.lib3.js' ], //Add any additional libraries you want here
		ready: function(arr) {
			//Ready callback
			print('Preloaded the following files: [' + arr.join(', ') + ']');
			
			//Now lets do some basic tests with the preloaded classes
			var Parent = ImportJS.unpack('tests.inheritance.Parent');
			var Child = ImportJS.unpack('tests.inheritance.Child');
			var CircularRefA = ImportJS.unpack('tests.circular.CircularRefA');
			var CircularRefB = ImportJS.unpack('tests.circular.CircularRefB');
			var Simple = ImportJS.unpack('tests.Simple');
			var myParentClass = new Parent();
			var myChildClass = new Child();
			var myCircRefA = new CircularRefA();
			var myCircRefB = new CircularRefB();
			var mySimpleClass = new Simple();
			print("\n<b>Begin other tests...</b>\n");
			print("Value of myParentClass.foo() = " + myParentClass.foo() + "\n");
			print("Value of myChildClass.foo() = " + myChildClass.foo() + "\n");
			print("Value of myParentClass.sharedValue = " + myParentClass.sharedValue + "\n");
			print("Value of myChildClass.sharedValue = " + myChildClass.sharedValue + "\n");
			print("Value of myCircRefA.toString() = " + myCircRefA.toString() + "\n");
			print("Value of myCircRefB.toString() = " + myCircRefB.toString() + "\n");
			print("Value of myCircRefA.getCircRefB() = " + myCircRefB.toString() + "\n");
			print("Value of myCircRefB.getCircRefA() = " + myCircRefA.toString() + "\n");
			print("Value of mySimpleClass.toString() = " + mySimpleClass.toString() + "\n");
			
			//Done! (You could even create more packages you wanted after the load is complete)
		},
		error: function(arr) {
			//This function will be called upon error
			print('Error preloading files: [' + arr.join(', ') + ']');
		}
	});

	//Utilizing the Packages we manually created
	//Note: Will still work if you move this code outside of the anonymous function scope, using function to demonstrate as if it were in its own class initiating itself)
	(function() {
		//Imports
		var SingletonClass = ImportJS.unpack('com.mcleodgaming.SingletonClass'),
			NormalClass = ImportJS.unpack('com.mcleodgaming.NormalClass'),
			AdvancedClass = ImportJS.unpack('com.mcleodgaming.AdvancedClass');

		//Other ways to import:
		//Just storing shortcut references
		/*
		var imports = ImportJS.unpack('com.mcleodgaming');
		var SingletonClass = imports.SingletonClass,
			NormalClass = imports.NormalClass,
			AdvancedClass = imports.AdvancedClass;
		*/
		
		//Domain name style paths
		/* (Note: This way will only work if you use variable-friendly characters and period delimiters)
		var SingletonClass = ImportJS.pkgs.com.mcleodgaming.SingletonClass,
			NormalClass = ImportJS.pkgs.com.mcleodgaming.NormalClass,
			AdvancedClass = ImportJS.pkgs.com.mcleodgaming.AdvancedClass;
		*/
		
		//Initialize
		var myNormalClass = new NormalClass();
		var myAdvancedClass = new AdvancedClass();

		print("<b>Begin basic tests...</b>\n");
		print("Value of SingletonClass.value() = " + SingletonClass.value() + "\n"); //<-Singleton class is like a "static", so there is no need to instantiate it
		print("Value of myNormalClass.value() = " + myNormalClass.value() + "\n");
		print("Value of myAdvancedClass.getSingletonValue() = " + myAdvancedClass.getSingletonValue() + "\n");
		print("Value of myAdvancedClass.getClassInstanceValue() = " + myAdvancedClass.getClassInstanceValue() + "\n");
	})();
}