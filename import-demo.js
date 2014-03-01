/*
Copyright (c) 2013 Greg McLeod  (Email: cleod9{at}gmail.com)

The below code demonstrates how to use ImportJS.

*/

//Print function for testing purposes
function print(str) {
	document.getElementById('output').innerHTML += str.split('\n').join('<br />') + "<br />";
}

//On DOM load I'm going to have main() called
function main() {
	//Creating Packages that don't need to be preloaded
	ImportJS.pack('com.mcleodgaming.StaticClass', function(module) {
		//Note: For static packages like this, you may want to create some sort of init() to perform initial setup
		
		//Exposes the property 'foo' and function 'value()'
		module.exports.foo = 'I am StaticClass';
		module.exports.value = function() {
			return this.foo;
		};
	});
	ImportJS.pack('com.mcleodgaming.NormalClass', function(module) {
		//Just a simple function, no fancy prototype definition here
		function NormalClass() { 
			var foo = 'I am NormalClass';
			this.value = function() {
				return foo;
			}
		};
		
		//Exposes NormalClass
		module.exports = NormalClass;
	});

	ImportJS.pack('com.mcleodgaming.AdvancedClass', function(module) {
		/* A slightly more advanced package that utilizes other packages */
		//Import class references (For potential circular dependencies, see docs for module.postCompile() usage)
		var StaticClass = ImportJS.unpack('com.mcleodgaming.StaticClass'),
			NormalClass = ImportJS.unpack('com.mcleodgaming.NormalClass');
		
		var AdvancedClass = function() {
			//Now we can create these classes on command (below line should execute safely)
			this.classInstance = new NormalClass();
		}
		AdvancedClass.prototype.classInstance = null;
		AdvancedClass.prototype.getStaticClassValue = function() {
			return StaticClass.value();
		};
		AdvancedClass.prototype.getClassInstanceValue = function() {
			return this.classInstance.value();
		};
		module.exports = AdvancedClass;
	});

	//Compile everything we have so far to be safe (Note: When preloading, packages are auto-compiled for you once they are all loaded)
	ImportJS.compile();

	//Our first set of packages are now available, first let's try utilizing the non-preloaded packages

	//Imports
	var StaticClass = ImportJS.unpack('com.mcleodgaming.StaticClass'),
		NormalClass = ImportJS.unpack('com.mcleodgaming.NormalClass'),
		AdvancedClass = ImportJS.unpack('com.mcleodgaming.AdvancedClass'); 

	//Other ways to import - Just storing shortcut references
	/*
	var imports = ImportJS.pkgs.com.mcleodgaming;
	var StaticClass = imports.StaticClass,
		NormalClass = imports.NormalClass,
		AdvancedClass = imports.AdvancedClass;
	*/

	//Other ways to import - Domain name style paths
	//Note: This way will only work if you use variable-friendly characters between your delimiters
	/*
	var StaticClass = ImportJS.pkgs.com.mcleodgaming.StaticClass,
		NormalClass = ImportJS.pkgs.com.mcleodgaming.NormalClass,
		AdvancedClass = ImportJS.pkgs.com.mcleodgaming.AdvancedClass;
		//Or alternatively this would work and be a workaround if you used odd characters in your package path
		var StaticClass = ImportJS.pkgs['com']['mcleodgaming']['StaticClass'],
	*/

	//Initialize
	var myNormalClass = new NormalClass();
	var myAdvancedClass = new AdvancedClass();

	print("<b>Begin basic tests...</b>\n");
	print("Value of StaticClass.value() = " + StaticClass.value() + "\n");
	print("Value of myNormalClass.value() = " + myNormalClass.value() + "\n");
	print("Value of myAdvancedClass.getStaticClassValue() = " + myAdvancedClass.getStaticClassValue() + "\n");
	print("Value of myAdvancedClass.getClassInstanceValue() = " + myAdvancedClass.getClassInstanceValue() + "\n\n");

	/* End basic tests, now lets try preloading */

	//How to preload files
	ImportJS.preload({
		baseUrl: '',
		//Pass as an object to describe entire package tree
		//Note: Keys are either folder names or class names, and values are contents or file names
		packages: {
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
			print('Preloaded the following files: [' + arr.join(', ') + ']\n');
			print("\n<b>Begin preloaded tests...</b>\n");
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
}