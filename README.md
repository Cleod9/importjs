# ImportJS #

----------

ImportJS is a small library that enables your code to conform to a **"class packaging"** system similar to that of ActionScript or Java. It also has an integrated preloading feature, so you can easily batch load your scripts and optionally build out a package tree at the same time (with dependency resolution!). This gives you the option to have strict file organization, which is especially useful when you have many external code files to load.(Alternatively this library can behave purely as an external JavaScript preloader if you don't want the extra functionality!)

 My goal with ImportJS was to re-create a similar coding workflow to Flash ActionScript without burdening the coder with all the specifics on how they should be using it. Unlike other libraries with similar features such as RequireJS or JSClass, with ImportJS you are not forced into using the "modular" aspects of the system. This gives you a lot more freedom with your naming conventions, as well as flexibility in how the library is used.

I've included a sample script called *import-examples.js* that demonstrates a simple way to use ImportJS, which you can view in action by checking out *examples.htm* in your web browser.

Enjoy!

P.S. This library also works great with [OOPS.js](https://github.com/Cleod9/JavaScript/tree/master/oopsjs "OOPS.js"), give it a shot!

## \*Disclaimer\*##
There seems to be an ongoing debate on the internet about how you should and shouldn't organize your JavaScript files, since it's apparently bad practice to load many external files on page load due to the increase of server requests. But how you organize your code is your responsibility, and I created ImportJS to be as flexible as possible in that regard. Naturally you can minify and consolidate all of your code, and still use ImportJS's packaging features so I don't see this as a problem. In this text I will suggest to you a means of organizing your code using this system, which might differ from the traditional web programming norm. Feel free to mold these techniques into your own if need be (or fork it and develop your own version!)

## Instructions ##
As stated above, ImportJS is built mainly for these 3 things:


- Batch preloading external JavaScript files (with ready and error callbacks)
- Organizing definitions into anonymously scoped functions represented as "[classpaths](http://en.wikipedia.org/wiki/Classpath_%28Java%29)" (Keeps your "classes" out of the global scope)
- Resolving dependencies between definitions (including circular references through [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection)!)

The library gives you the flexibility to do all of these things are once, or just the options you choose. The below instructions may look a little daunting at first, but trust me, once you see the code in action you'll catch on quickly. So let's get started!


### Include in HEAD ###

First, include the minified ImportJS script in your `<head>` tag.
```javascript
<script type="text/javascript" src="path/to/import.min.js">
```

### ImportJS Properties ###

Review the various properties that exist in the `ImportJS` Object below. (e.g. `ImportJS.propertyNameHere`)

`pkgs` - An Object tree that contains your entire package structure, where keys are package names/directories and values are references to data inside the package.

`uncompiled` - An Array of uncompiled package ID Strings. (i.e. "unprocessed" packages)

`compiled` - An Array of all compiled package ID Strings. (i.e. "processed" packages)

`settings` - Object containing miscellaneous settings. Currently the only available settings are `settings.debug`, which enables you to turn on or off the console logs from ImportJS for testing purposes, and `settings.delimiter`, which allows you to specify the separator to use for your "class paths" (defaults to a period '`.`', which will  only have any effect when using `preload()` and you pass an Object as the `files` parameter.)

### ImportJS Functions ###

(Note: All functions are accessed through the global `ImportJS` Object (e.g. `ImportJS.functionNameHere()`))

`pack(id, func, [compiled])` - "Packs" your Object definition identified by the provided String `id`. The `func` parameter expects a Function that returns a reference to your "Class" definition. This would usually be a Function, static Object, or a Class definition created by some external library. The optional `compiled` parameter can be included and set to `false` to change the return value expectation. The term "compiled" in this sense refers to ImportJS's way of handling dependencies. By setting `compiled` to false, you are telling ImportJS **to delay the actual packing** until preloading is completed or `ImportJS.compile()` is manually called. Then instead of returning a definition, you should return a 2-slot array, where index 0 would be the reference to the definition you created, and index 1 is a separate function dedicated to importing additional dependencies. This is explained further below under "Creating a Package: Uncompiled Package".

`unpack(id)` - Retrieves your Object definition that was previously packed using `pack()` specified by the provided String `id`

`compile()` - Forcefully compiles all currently `uncompiled` code. (Note that in most cases you'll never need to use this)

`preload(options)` - Preloads files with config settings specified by the `options` Object parameter. (See "Preloading External JavaScript Files" below for details)



### Preloading External JavaScript Files ###

Use `ImportJS.preload(options)` to load in your JavaScript files. The `options` argument expects an Object with the following properties, all of which are optional:

`baseUrl` - Base path for the files to preload. Can be relative or absolute. (Default = '')

`files` - Object or Array of file paths. These paths are relative to `baseUrl`. It is recommended not to use urls or parent directories here, since they will affect `strict` mode (see `strict` option below). Providing an Array  is easiest, since you simply provide a list of relative URLs (although load order will not be guaranteed). ImportJS will assume these paths match the package structure you set up, minus the ".js" extension of the file, and throw an error if there is an inconsistency. So for example, if you provide the path "js/com/main.js", ImportJS will expect that file to have a script inside that says `ImportJS.pack('js.com.main')`. (Set the `strict` option to false disable this feature). The Object method is a little different, where the object keys describe the path, and the object values describe files and directories. So for example, providing the object `{ com: { js: { main: 'main.js' } } }` would result in the same package build-out as above.  (Default = [])

`ready` - A callback Function that triggers once all files are loaded. (Default = null)

`error` - A callback Function that triggers if there is a problem loading one or more files. (Default = null)

`removeTags` - ImportJS by default will keep the `<script>` tags from the loaded files in your `<head>`. Set to false to have them removed when the load is complete. (Default = true)

`strict` - When set to true, ImportJS will throw an error if the file path to your package does not match the package that was imported upon load.  Set to false to disable this feature. (Default = true)

`timeout` - Number of milliseconds before the preloader should timeout while loading any given file (Default: 5000)

`libs` - Array of URLs/paths pointing to other libraries you would like to load. These files will not be under watch by the `strict` parameter, and will load in the order supplied. (Default = [])

`autocompile` - Automatically "compile" the packages you have created. Packages cannot and will not be compiled more than once, and attempting to unpack an uncompiled package will automatically compile it. The main reason you would disable this option is if you wanted to delay the compilation further due to some dependency that must be packed after the load completes.  (Default = true).

### Creating a Package ###

Creating a package is done through the `pack()` function which acts as a wrapper for your code. Below demonstrates how to create a **compiled** and **uncompiled** package:

#### Compiled Package ####
Use compiled packages any time you know you won't need a dependency, or if you are certain all required dependencies are loaded/packed beforehand:
```javascript 
ImportJS.pack('tests.Simple', function() {
	function Simple() {
		/* Definition here */
		this.toString = function() {
			return "I am Simple class.";
		};
	}
	
	return Simple;
});
```

#### Uncompiled Package ####
Uncompiled packages are for classes that require one or more dependencies. (e.g. parent-child extension, circular references, etc.) You must pass `false` as the `compiled` parameter in order for ImportJS to recognize it as uncompiled:
```javascript 
ImportJS.pack('tests.Simple', function() {
	/* Declare dependencies here */
	var SomeDependency;

	function Simple() {
		/* Definition here */
		this.dependencyRef = new SomeDependency();
		this.toString = function() {
			return "I have access to: " + this.dependencyRef.toString() + "!";
		};
	}
	
	//Return value is now an Array with two items, the class reference + function
	return [Simple, function() {
		/*Unpack dependencies here*/
		SomeDependency = ImportJS.unpack('tests.SomeDependency');
	}];
}, false); //<-Notice we pass false this time
ImportJS.pack('tests.SomeDependency', function() {
	//Example dependency
	function SomeDependency()
	{
		this.toString = function() {
			return "[SomeDependency]";
		};
	}
	return SomeDependency;
});
//Compile and resolve dependencies
ImportJS.compile();
//Pull out package and test
var Simple = ImportJS.unpack('tests.Simple'); //Note: Unpacking a class will automatically uncompile it if needed ;)
var mySimple = new Simple();
console.log(mySimple.toString()); //Outputs "I have access to: [SomeDependency]!"
```
Notice the return Array this time? ImportJS will take advantage of the function scope in the above setup and inject `SomeDependency` into the `Simple` definition by delaying execution until `ImportJS.compile()` is called. The `compile()` function will loop through all uncompiled packages and execute the function in the second index of the Array you returned, all the while the Object reference at index 0 is still available. This is possible since ImportJS is built to simply hold class definitions, it does not instantiate anything new on its own. Try loading ImportJS and running the above example, and you'll see that the `tests.Simple` package is still able to utilize `tests.SomeDependency` even though it is technically defined first.

### Importing a Package ###

Importing a package is synonymous to unpacking it using `unpack()`. Packages are identified by String IDs, but organized into a tree-like structure at the same time. This gives you multiple ways to unpack:


#### Import Single Package by String (Safest) ####
The standard way to import:
```javascript
//Tip: Use same variable name as the class name at the end of the package for easy-reading
var MyPackage1 = ImportJS.import('com.code.MyPackage1');
var MyPackage2 = ImportJS.import('com.code.MyPackage2');
var MyPackage3 = ImportJS.import('com.code.MyPackage3');
```

#### Import by Direct Reference ####
Use direct references through ImportJS's `pkgs` property:
```javascript
//Note: This will not work if the packages are not compiled
var MyPackage1 = ImportJS.pkgs.com.code.MyPackage1;
var MyPackage2 = ImportJS.pkgs.com.code.MyPackage2;
var MyPackage3 = ImportJS.pkgs.com.code.MyPackage3;
```

#### Import Shorthand ####
Create a temporary variable to create a "shortcut" to your packages:
```javascript
var MyImports = ImportJS.import('com.code');
var MyPackage1 = MyImports.MyPackage1;
var MyPackage2 = MyImports.MyPackage2;
var MyPackage3 = MyImports.MyPackage3;
```

## Usage With [OOPS.js](https://github.com/Cleod9/JavaScript/tree/master/oopsjs "OOPS.js") ##

I designed ImportJS with OOPS.js functionality in mind, and when you combine the two you have something that looks awfully close an ActionScript workflow. Check out an adaption of the above examples using OOPS.js:

### Adaptation of the 'Simple' class using OOPS.js ###
```javascript 
ImportJS.pack('tests.Simple', function() {
	var Simple = OOPS.extend({
		toString: function() {
			return "I am Simple class.";
		}
	});
	
	return Simple;
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
ImportJS.pack('com.MyProject.Child', function() {
	//By placing unpack() here, during the compilation process this will force Parent to get compiled first
	var Parent = ImportJS.unpack('com.MyProject.Parent');

	//Extend as normal
	var Child = Parent.extend({
		toString: function() {
			return "I am child!";
		}
	});
	
	//Return value is now an Array with two items, the class reference + function
	return [Child, function() {
		/*Place non-inheritance related dependencies here */
	}];
}, false);

ImportJS.pack('com.MyProject.Parent', function() {
	//Delay unpacking since inheritance is not required for SomeOtherDependency
	var SomeOtherDependency;

	//Class definition
	var Parent = OOPS.extend({
		toString: function() {
			return "I am child!";
		},
		printDependency: function() {
			var dep = new SomeOtherDependency();
			console.log(dep.toString());
		}
	});
	
	return [Parent, function() {
		//Now we can unpack
		SomeOtherDependency = ImportJS.unpack('com.MyProject.SomeOtherDependency');
	}];
}, false);

ImportJS.pack('com.MyProject.SomeOtherDependency', function() {
	//Delay unpacking since inheritance is not required for Parent
	var Parent;

	var SomeOtherDependency = OOPS.extend({
		toString: function() {
			return "I am some random dependency";
		}
	});
	
	return [SomeOtherDependency, function() {
		//Now we can unpack
		Parent = ImportJS.unpack('com.MyProject.Parent');
	}];
}, false);

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

**1.0.0**

-Initial release

----------

Copyrighted © 2013 by Greg McLeod

GitHub: [https://github.com/cleod9](https://github.com/cleod9)