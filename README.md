# ImportJS #

----------

ImportJS is a small library that enables your code to conform to a **"class packaging"** that merges together the concepts of modules from Node.js and packages from ActionScript/Java. It also has an integrated preloading feature, so you can easily batch load your scripts and optionally build out a package tree at the same time (with dependency resolution!). This gives you the ability to have a hierarchical file organization, which is especially useful when you have many external code files to load. (Alternatively this library can behave purely as an external JavaScript preloader if you don't want the extra functionality!)

 My main goal with ImportJS was to re-create a similar coding workflow to Flash ActionScript for JavaScript developers, which in my opinion makes JavaScript applications much more scalable. Unlike other libraries with similar features such as RequireJS or JSClass, I wanted to simplify the the complexity of module creation by providing a 

I've included a sample script called *import-examples.js* that demonstrates a simple way to use ImportJS, which you can view in action by checking out *examples.htm* in your web browser.

Enjoy!

P.S. This library also works great with [OOPS.js](https://github.com/Cleod9/oopsjs "OOPS.js"), give it a shot!

## \*Disclaimer\*##
There seems to be an ongoing debate on the internet about how you should and shouldn't organize your JavaScript files, since it's apparently bad practice to load many external files on page load due to the increase of HTTP  requests. But how you organize your code is your responsibility, and I created ImportJS to be as flexible as possible in that regard. Even with ImportJS you could just minify/concatenate all of your code to a single file so I don't see this as a problem. In this text I will suggest to you a potential means of organizing your code using this system, which might differ from the traditional web programming norm. Feel free to mold these techniques into your own if need be (or fork it and develop your own version!)

## Instructions ##
As stated above, ImportJS is built mainly for these 3 things:


- Batch preloading external JavaScript files (with ready and error callbacks)
- Organizing definitions into anonymously scoped functions represented as "[packages/classpaths](http://en.wikipedia.org/wiki/Classpath_%28Java%29)" (Keeps your "classes" out of the global scope)
- Resolving dependencies between definitions (including circular dependencies via [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection)!)

The library gives you the flexibility to do all of these things at once, or just the options you choose. The below instructions may look a little daunting at first, but trust me, once you see the code in action you'll catch on quickly. So let's get started!


### Include in HEAD ###

First, include the ImportJS script in your `<head>` tag.
```javascript
<script type="text/javascript" src="path/to/import.min.js">
```

### ImportJS Properties ###

Review the various properties that exist in the `ImportJS` Object below. (e.g. `ImportJS.propertyNameHere`)

`pkgs` - An Object tree that contains your entire package structure, where keys are package names/directories and values are references to data inside the package.

`uncompiled` - An Array of uncompiled package ID Strings. (i.e. "unprocessed" packages)

`compiled` - An Array of all compiled package ID Strings. (i.e. "processed" packages)

`settings` - Object containing miscellaneous settings. Currently the only available settings are `settings.debug`, which enables you to turn on or off the console logs from ImportJS for testing purposes, and `settings.delimiter`, which allows you to specify the separator to use for your "class paths" (defaults to a period '`.`' to resemble ActionScript/Java)

### ImportJS Functions ###

(Note: All functions are accessed through the global `ImportJS` Object (e.g. `ImportJS.functionNameHere()`)

`pack(id, func(module, exports))` - "Packs" your code definition identified by the provided String `id`. The `func` argument expects a function that accepts 2 parameters, `module` and `exports`. (For you Node.js folks, this should look quite familiar). ImportJS provides an object called `module` as the first argument that contains the properties `exports` and `postCompile` (e.g. `{ exports: {}, postCompile: null }`). The second argument `exports` passed to the function you provide is actually a ***shortcut*** to `module.exports` for convenience purposes, therefore it is optional and may be excluded if desired. The role of the `module.exports` object in general is to let you expose methods/properties from your package to the outside world. This would usually contain a function, static object, or perhaps some other definition created by an external library.  Lastly, the optional property `module.postCompile` is designed to be set to a function for importing additional dependencies after ImportJS has compiled that particular package. This enables a mechanism for **dependency injection**.

`unpack(id)` - Retrieves your Object definition that was previously packed using `pack()` specified by the provided String `id`

`compile()` - Forcefully compiles all currently "uncompiled" code (i.e. code yet to be processed by ImportJS).  When initially "packing" code, ImportJS does not execute the code immediately. This allows you to write all of your definitions first so you can be certain all of your packages are defined. When preloading code ImportJS will do this for you automatically by default, but non-preloaded code you must call this once you've finished defining all of your packages.

`preload(options)` - Preloads files with config settings specified by the `options` Object parameter. (See "Preloading External JavaScript Files" below for details)



### Preloading External JavaScript Files ###

Use `ImportJS.preload(options)` to load in your JavaScript files. The `options` argument expects an Object with the following properties, all of which are optional:

`baseUrl` - Base path for the files to preload. Can be relative or absolute. (Default = '')

`packages` - Object or Array of file paths. These paths are relative to `baseUrl`. It is recommended not to use absolute urls or parent directories here, since they will affect `strict` mode (see `strict` option below). Providing an Array  is easiest, since you simply provide a list of relative URLs (although load order will not be guaranteed). ImportJS will assume these paths match the package structure you set up, minus the ".js" extension of the file, and throw an error if there is an inconsistency. So for example, if you provide the path "com/main.js", ImportJS will expect that file to have a script inside that says `ImportJS.pack('com.main')`. (Set the `strict` option to false disable this feature). Providing an Object to this property is a little different. The object keys describe the path, and the object values describe files and directories. So for example, providing the object `{ com: { main: 'main.js' } }` would result in the same package build-out as above.  (Default = [])

`ready(files)` - A callback Function that triggers once all files are loaded. ImportJS passes a list of the files that were loaded as an argument. (Default = null)

`error(files)` - A callback Function that triggers if there is a problem loading one or more files. ImportJS passes a list of the files that couldn't be loaded as an argument.  (Default = null)

`removeTags` - ImportJS by default will remove the `<script>` tags it generates your `<head>` as files are loaded. Set to false to have them remain. (Default = true)

`strict` - When set to true, ImportJS will throw an error if the file path to your package does not match the package that was imported upon load.  Set to false to disable this feature. (Default = true)

`timeout` - Number of milliseconds before the preloader should timeout while loading any given file (Default: 5000)

`libs` - Array of URLs/paths pointing to other libraries you would like to load prior to loading your packages. These files will not be under watch by the `strict` parameter, and will load in the order supplied. (Default = [])

`autocompile` - Automatically "compile" the packages you have created. Packages cannot and will not be compiled more than once, and attempting to unpack an uncompiled package will automatically compile it. The main reason you would disable this option is if you wanted to delay the compilation further due to some dependency that must be packed after the load completes.  (Default = true).

### Creating a Package ###

Creating a package is done through the `pack()` function which acts as a wrapper for your code. Below demonstrates how to create packages:

```javascript 
ImportJS.pack('tests.Example', function(module) {
	//Declare immediate or non-circular dependencies here
	var Immediate = ImportJS.unpack('tests.Immediate');
	
	/* Declare circular dependencies here, we will hoist up later */
	var SomeDependency;

	//Get our export ready
	function Example() {
		/* Definition here */
		this.dependencyRef = new SomeDependency();
		this.toString = function() {
			return "I am Example and I have access to: " + this.dependencyRef.toString() + " and " + Immediate.toString() + "!";
		};
	}
	
	//Set exports to 'Example', when we unpack in another package we will receive 'Example'
	module.exports = Example;
	module.postCompile = function() {
		/*Unpack circular dependencies here, grants Example access to this thanks to scope/hoisting  */
		SomeDependency = ImportJS.unpack('tests.SomeDependency');
	};
});
ImportJS.pack('tests.Immediate', function(module, exports) {
	//Attach toString() to exports, when we unpack in another package we have access to toString()
	//(Note: This is the equivalent of writing "module.exports.toString = ...")
	exports.toString = function() {
		return "[Immediate]";
	};
});
ImportJS.pack('tests.SomeDependency', function(module) {
	var Example;
	
	//Get our export ready
	function SomeDependency() {
		this.toString = function() {
			return "[SomeDependency]";
		};
		//Give SomeDependency the ability to create Example instances
		this.makeExample = function() {
			return new Example();
		};
	}

	//Set exports to 'SomeDependency', when we unpack in another package we will receive 'SomeDependency'
	module.exports = SomeDependency;
	module.postCompile = function() {
		/* Unpack circular dependencies here, grants SomeDependency access to this thanks to scope/hoisting */
		Example = ImportJS.unpack('tests.Example');
	};
});

//Compile and resolve dependencies
ImportJS.compile();

//Pull out package and test
var Example = ImportJS.unpack('tests.Example'); //Note: Unpacking a class will automatically compile it if needed ;)
var myExample = new Example();
console.log(myExample.toString()); //Outputs "I have access to: [SomeDependency]!"
console.log(myExample.dependencyRef.toString()); //Outputs [SomeDependency]
console.log(myExample.dependencyRef.makeExample().toString()); //Outputs "I have access to: [SomeDependency]!"
```
Notice the use of `postCompile()`? ImportJS will take advantage of the function scope in the above setup and inject `SomeDependency` into the `Example` definition by executing `postCompile()` once right after compilation but before it is ever retrieved via unpack(). In other words, you are guaranteeing that `SomeDependency` is available for use in your function scope no matter what order these packages are loaded. Try loading ImportJS and running the above example, and you'll see that the `tests.SomeDependency` package is still able to utilize `tests.Example` regardless of load order.

### Importing a Package ###

Importing a package is synonymous to unpacking it using `unpack()`. Packages are identified by String IDs, but organized into a tree-like structure at the same time. This gives you multiple ways to unpack:


#### Import Single Package by String (Safest) ####
The standard way to import that ensures proper dependency resolution and will auto-compile for you if needed:
```javascript
//Tip: Use same variable name as the class name at the end of the package for easy-reading
var MyPackage1 = ImportJS.unpack('com.code.MyPackage1');
var MyPackage2 = ImportJS.unpack('com.code.MyPackage2');
var MyPackage3 = ImportJS.unpack('com.code.MyPackage3');
```

#### Import by Direct Reference ####
Use direct references through ImportJS's `pkgs` property (do not use when you have dependencies to be resolved):
```javascript
//Note: This will not work if you use invalid characters in your string names, or if you have not called compile() yet
var MyPackage1 = ImportJS.pkgs.com.code.MyPackage1;
var MyPackage2 = ImportJS.pkgs.com.code.MyPackage2;
var MyPackage3 = ImportJS.pkgs.com.code.MyPackage3;
```

#### Import Shorthand ####
Create a temporary variable to create a "shortcut" to your packages (same caveats as the previous way):
```javascript
var MyImports = ImportJS.unpack('com.code');
var MyPackage1 = MyImports.MyPackage1;
var MyPackage2 = MyImports.MyPackage2;
var MyPackage3 = MyImports.MyPackage3;
```

## Usage With [OOPS.js](https://github.com/Cleod9/oopsjs "OOPS.js") ##

I designed ImportJS with OOPS.js functionality in mind, and when you combine the two you have something that looks awfully close an ActionScript workflow. Check out an adaption of the above examples using OOPS.js:

### Adaptation of the 'Simple' class using OOPS.js ###
```javascript 
ImportJS.pack('tests.Simple', function(module) {
	var Simple = OOPS.extend({
		toString: function() {
			return "I am Simple class.";
		}
	});
	
	module.exports = Simple;
});

//Can never hurt to call compile()
ImportJS.compile();

//Pull out package and test
var Simple = ImportJS.unpack('tests.Simple');
var mySimple = new Simple();
console.log(mySimple.toString()); //Outputs "I am Simple class."
```

### Dependencies/Inheritance with OOPS.js ###

Let's do some dependency/inheritance stuff manually without pre-loading to demonstrate how the loading order of these two packages will not matter anymore thanks to ImportJS!

```javascript
//Define packages
ImportJS.pack('com.MyProject.Child', function(module) {
	//By placing unpack() here, during the compilation process this will force Parent to get compiled first
	var Parent = ImportJS.unpack('com.MyProject.Parent');

	//Extend as normal
	var Child = Parent.extend({
		toString: function() {
			return "I am child!";
		}
	});
	
	//Return value is now an Array with two items, the class reference + function
	module.exports = Child;
	module.postCompile = function() {
		/*Place non-inheritance related dependencies here */
	};
});

ImportJS.pack('com.MyProject.Parent', function(module) {
	//Delay unpacking since inheritance is not required for SomeOtherDependency
	var SomeOtherDependency;

	//Class definition
	var Parent = OOPS.extend({
		toString: function() {
			return "I am parent!";
		},
		printDependency: function() {
			var dep = new SomeOtherDependency();
			console.log(dep.toString());
		}
	});
	
	module.exports = Parent;
	module.postCompile = function() {
		//Now we can unpack
		SomeOtherDependency = ImportJS.unpack('com.MyProject.SomeOtherDependency');
	};
});

ImportJS.pack('com.MyProject.SomeOtherDependency', function(module) {
	//Delay unpacking since inheritance is not required for Parent
	var Parent;

	var SomeOtherDependency = OOPS.extend({
		toString: function() {
			return "I am some random dependency";
		}
	});
	
	module.exports = SomeOtherDependency;
	module.postCompile = function() {
		//Now we can unpack
		Parent = ImportJS.unpack('com.MyProject.Parent');
	};
});

//Manually compile
ImportJS.compile();

//Start unpacking and writing code!
var Child = ImportJS.unpack('com.MyProject.Child');
var kid = new Child();
console.log(kid.toString()); //Prints "I am child!!"
kid.printDependency(); //Prints "I am some random dependency"
```


## Further Examples ##

See `demo.htm` and `import-demo.js` to see the code in action. They utilize the code under the `tests` folder to demonstrate preloading packages using the package structure while at the same time defining some additional packages inside of `import-demo.js` itself.

## Terms of Use ##

Free to use in any projects without notifying me, nor is credit needed (though it'd be much appreciated!). Just do not re-distribute it under anyone else's name and be sure to retain the copyright notice in the source!

## TL;DR ##

### Preload Scripts ###

Perhaps you came here just looking for something to preload your scripts and you don't care about this packaging stuff, Welp, here you go:

```javascript
//Preloads scripts in the given order
ImportJS.preload({ 
	libs: [ 'path1', 'path2', 'path3', 'pathN' ],
	ready: function() {
		console.log("done");
	},
	error: function() {
		console.log("error");
	}
});
```

## Version History ##

**2.0.2**

-Readme typo

**2.0.1**

-Fixed obscure bug with package IDs that would occur if you had dependencies that required an immediate unpack()

**2.0.0**

-Introduced a new programming model that merges Node.js module style with ActionScript/Java-style packages.

-Removed the "compiled" argument for pack() to improve code consistency

-Calling compile() is now always required for non-preloaded packages packages (though preloading will still compile for you)

-Renamed "files" preload parameter to "packages"

**1.4.0**

-One last major re-implementation to simplify the package declaration in Node.js

**1.3.0**

-Re-implemented the method of loading modules as it did not properly support a single shared package store in 1.2.0 (Node.js only)

**1.2.0**

-Extracted node-specific identifiers to improve linting

-Slight syntax adjustments for even better linting

-Node.js version now loads the external files via require()

**1.1.0**

-JSHint cleanup and syncing versioning with node-importjs

-Removed Node references for JSHint (this library is now independent from its Node counterpart)

**1.0.1**

-Modified for Node.js compatibility

**1.0.0**

-Initial release

----------

Copyrighted © 2013 by Greg McLeod

GitHub: [https://github.com/cleod9](https://github.com/cleod9)