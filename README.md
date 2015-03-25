# ImportJS #

----------

ImportJS is a library that enables your code to conform to a **"class packaging"** system that merges together the concepts of modules from Node.js and packages from ActionScript/Java. It also has an integrated preloading feature, so you can easily batch load your scripts and optionally build out a package tree at the same time (with easy dependency resolution!). This gives you the ability to have a hierarchical file organization, which is especially useful when you have many external code files to load. (Alternatively this library can also behave purely as an external JavaScript preloader if you don't want the extra functionality!)

I've included a sample script called *import-demo.js* that demonstrates a simple way to use ImportJS, which you can view in action by checking out *demo.htm* in your web browser.

Enjoy!

P.S. This library also works great with [OOPS.js](https://github.com/Cleod9/oopsjs "OOPS.js"), give it a shot!

## Instructions ##
As stated above, ImportJS is built mainly for these 3 things:


- Batch preloading external JavaScript files (with ready and error callbacks)
- Creating modules via anonymously scoped functions represented as "[packages/classpaths](http://en.wikipedia.org/wiki/Classpath_%28Java%29)" (Keeps your "classes" out of the global scope)
- Resolving dependencies between definitions (including circular dependencies via deferred [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection)!)

The library gives you the flexibility to do all of these things at once, or just the ones you choose. The below instructions may look a little daunting at first, but trust me, once you see the code in action you'll catch on quickly. So let's get started!


### Include in HEAD ###

First, include the ImportJS script in your `<head>` tag.
```javascript
<script type="text/javascript" src="path/to/import.min.js">
```


### Creating a Package ###

Creating a package is done through the `ImportJS.pack()` function which acts as a wrapper for your module code. Below demonstrates how to create packages:

```javascript 
ImportJS.pack('tests.Example', function(module) {
	//Declare immediate or non-circular dependencies here
	var Immediate = this.import('tests.Immediate');
	//Declare circular dependencies here that we will hoist up later
	var SomeDependency;
	this.inject(function() {
		//Unpack circular dependencies here, grants access to tests.SomeDependency thanks to hoisting
		SomeDependency = this.import('tests.SomeDependency');
	});

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
	this.inject(function() {
		//Grants access to tests.Example thanks to hoisting
		Example = this.import('tests.Example');
	});
	
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
});
```
Ad now loading the code:

```javascript 
//Compile and resolve dependencies
ImportJS.compile();

//Pull out package and test
var Example = ImportJS.unpack('tests.Example'); //Note: Unpacking a class will automatically compile it if needed ;)
var myExample = new Example();

//Outputs "I am Example and I have access to: [SomeDependency] and [Immediate]!"
console.log(myExample.toString());

//Outputs [SomeDependency]
console.log(myExample.dependencyRef.toString());

//Outputs "I am Example and I have access to: [SomeDependency] and [Immediate]!!"
console.log(myExample.dependencyRef.makeExample().toString());
```
Notice the use of `inject()`? ImportJS will take advantage of the function scope in the above setup and inject `SomeDependency` into the `Example` definition by executing `inject()` once right after compilation but before it is ever retrieved via `unpack/import`. In other words, you are guaranteeing that `SomeDependency` is available for use in your function scope no matter what order these packages are loaded. Try loading ImportJS and running the above example, and you'll see that the `tests.SomeDependency` package is still able to utilize `tests.Example` regardless of load order.


### Global ImportJS Methods ###

(Note: All functions are accessed through the global `ImportJS` Object (e.g. `ImportJS.functionNameHere()`)

`pack(id, function (module, exports) { })` - "Packs" your code definition identified by your provided case-sensitive String `id`. The second argument expects a function that accepts 2 parameters, `module` and `exports`.  **This is where your module code lives**, so for you Node.js folks this should look quite familiar. ImportJS provides an object called `module` as the first argument that contains the property called `exports` (e.g. `{ exports: {} }`). The second argument `exports` passed to the function you provide is actually a ***shortcut*** to `module.exports` for convenience purposes, therefore it is optional and may be excluded if desired. The role of the `module.exports` object in general is to let you expose methods/properties from your package to the outside world. This would usually contain a function, static object, or perhaps some other definition created by an external library.

`unpack(id)` - Retrieves your module that was previously packed using `pack()`, specified by the provided String `id`. **This method should only be called in the global scope of your application.** If you need to import code into a module, see `this.import` down below.

`compile()` - Compiles all currently "uncompiled" code (i.e. code yet to be executed by ImportJS).  When initially "packing" code, ImportJS does not execute the code immediately. This allows you to write all of your definitions first so you can be certain all of your packages are defined. When preloading code, ImportJS can do this for you automatically. But for non-preloaded code you must call this once you've finished loading all of your packages. ImportJS will automatically try to compile packages when it encounters import/unpack on the fly, however is recommended that you compile them right away to avoid potential confusion.

`preload(options)` - Preloads files with config settings specified by the `options` Object parameter. (See "Preloading External JavaScript Files" below for details)

### Internal ImportJS Functions ###

ImportJS also contains a couple of internal functions that are bound to modules that you you can write within  `function (module, exports) { }` for the `pack()` function. They are as follows:

`this.import(id)` - This returns the specified package String `id` just like `ImportJS.unpack`, but is guaranteed to be bound to the proper ImportJS instance. Please use this when importing packages inside of modules.

`this.inject(callback)` - This function accepts a callback function that is executed during the `compile()` step. This offer a way to achieve **deferred dependency injection** by hoisting up certain class references after the full code base has been loaded.


### Preloading External JavaScript Files ###

Use `ImportJS.preload(options)` to load in your JavaScript files. The `options` argument expects an Object with the following properties, all of which are optional:

`baseUrl` - Base path for the files to preload. Can be relative or absolute. (Default = '')

`packages` - Object or Array of file paths. These paths are relative to `baseUrl`. It is recommended not to use absolute urls or parent directories here, since they will affect `strict` mode (see `strict` option below). Providing an Array  is easiest, since you simply provide a list of relative URLs. ImportJS will assume these paths match the package structure you set up, minus the ".js" extension of the file, and throw an error if there is an inconsistency. So for example, if you provide the path "com/main.js", ImportJS will expect that file to have a script inside that says `ImportJS.pack('com.main')`. (Set the `strict` option to `false` disable this feature). Providing an Object to this property is a little different. The object keys describe the path, and the object values describe files and directories. So for example, providing the object `{ com: { main: 'main.js' } }` would result in the same package build-out as I mentioned before.  (Default = [])

`plugins` - Array of plugin names to be loaded by ImportJS. By default it is not necessary to use this field since ImportJS will regex your packages source text to discover any plugins. As such, plugins are always loaded after your application's main dependencies but are compiled before your application code begins execution. (Default = [])

`ready(files)` - A callback Function that triggers once all files are loaded. ImportJS passes a list of the files that were loaded as an argument. (Default = null)

`error(files)` - A callback Function that triggers if there is a problem loading one or more files. ImportJS passes a list of the files that couldn't be loaded as an argument.  (Default = null)

`removeTags` - ImportJS by default will remove the `<script>` tags it generates in your `<head>`tag as files are loaded. Set to false to have them remain. (Default = true)

`strict` - When set to true, ImportJS will throw an error if the file path to your package does not match the package that was imported upon load.  Set to false to disable this feature. (Default = true)

`timeout` - Number of milliseconds before the preloader should timeout while loading any given file (Default: 5000)

`libs` - Array of URLs/paths pointing to other libraries you would like to load prior to loading your packages. These files will not be under watch by the `strict` parameter, and will load in the order supplied. (Default = [])

`autoCompile` - Automatically "compile" the packages you have loaded once all loading has been completed. Packages cannot and will not be compiled more than once, and attempting to unpack an uncompiled package will automatically compile it. The main reason you would disable this option is if you wanted to delay the compilation further due to some dependency that must be fetched after loading completes.  (Default = true).

`entryPoint` - You can define a package name string to be the entry point of the application. Use the format `entry.point.path:[action]`, where `[action]` can be substituted with either the word `new` to automatically call `new package()` (assuming it exports a function), or you can write a function name exposed by the package to be executed. For example, `entryPoint: "path.to.main:new"` would call the `new` operator on the returned export from the the class defined in  `path.to.main`. If you wrote `entryPoint: "path.to.main:init"` it would instead call the  static `init()` function exposed by the class defined in `path.to.main`.    (Default = null).

## Quick Note on Importing a Package ##

Importing a package is synonymous to unpacking it using `unpack()`. However it's important to distinguish how you import a package into the global namespace VS from within a module.


#### Import package from within a module ####
The `this` reference from within modules exposes an `import()` function to import a package.
```javascript
var MyPackage1 = this.import('com.code.MyPackage1');
```

#### Import package to the global namespace ####
From the global namespace, you can call `ImportJS.unpack` to expose a package:
```javascript
var MyPackage1 = ImportJS.unpack('com.code.MyPackage1');
```

## Plugin System ##

As of v3.0, there is a new plugin system to make ImportJS more extensible. This allows developers of third party libraries to implement ImportJS-compatible versions of their code that no longer pollute the global namespace.

```javascript
/* js/plugins/myplugin/myplugin.js */
ImportJS.pack('myplugin', function (module, exports) {
  //Any imports in here are relative to the myplugin/ folder
 
  module.exports = {
    doSomething: function () {
      console.log("This is my plugin.");
    }
  };
});
 
/* js/main.js */
ImportJS.pack('main', function (module, exports) {
  var myplugin = this.plugin('myplugin');
 
  exports.run = function () {
    myplugin.doSomething();
  };
});
 
/* js/initialize.js */
//The plugin will be detected automatically via regex
ImportJS.preload({
  baseUrl: 'js/',
  packages: ['main.js'],
  entryPoint: 'main:run'
});
```
In order to use the plugin system you must load your library via the `preload()` function and allow function source parsing in order to pick up the dependencies (enabled by default). This will allow you to load plugins that have their own file hierarchy under a relative `"plugins/"` folder that is independent of your project. The naming convention goes `"plugins/pluginName/pluginName.js"`. Plugins can have potentially infinite depth, so you can build out modules that have their own versions of specific dependencies. Node.js devs can think of this as a `node_modules` folder for the browser!

## Using ImportJS as Solely a Script Loader##


Perhaps you came here just looking for something to preload your scripts and you don't care about the rest of this stuff? In that case:

```javascript
//Preloads scripts in the given order
ImportJS.preload({ 
	libs: [ 'path1', 'path2', 'path3', 'pathN' ],
	ready: function(filesArr) {
		console.log("done, loaded files: ", filesArr);
	},
	error: function(filesArr) {
		console.log("error on files: ", filesArr);
	}
});
```


## Usage With [OOPS.js](https://github.com/Cleod9/oopsjs "OOPS.js") ##

This library interfaces great with OOPS.js if you need a simple class system. See the example below:

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

Let's do some dependency/inheritance stuff to demonstrate how the loading order of these two packages will not matter anymore thanks to ImportJS!

```javascript
//Child Module
ImportJS.pack('com.MyProject.Child', function(module) {
	//By placing this.import() here, during the compilation process this will always force Parent to get compiled first
	var Parent = this.import('com.MyProject.Parent');

	//Extend as normal
	var Child = Parent.extend({
		toString: function() {
			return "I am child!";
		}
	});
	
	//Return value is now an Array with two items, the class reference + function
	module.exports = Child;
});

//Parent Module
ImportJS.pack('com.MyProject.Parent', function(module) {
	//Delay import since Child needs Parent to be compiled first
	var Child;
	this.inject(function() {
		//Now we can safely import
		Child = this.import('com.MyProject.Child');
	});

	//Class definition
	var Parent = OOPS.extend({
		_statics_: {
			makeChild: function() {
				return new Child();
			}
		},
		toString: function() {
			return "I am parent!";
		}
	});
	
	module.exports = Parent;
});
```
And now loading everything:

```javascript
//Manually compile
ImportJS.compile();

//Start unpacking and writing code!
var Parent = ImportJS.unpack('com.MyProject.Parent');
var Child = ImportJS.unpack('com.MyProject.Child');
var kid1 = new Child();
var kid2 = Parent.makeChild();
console.log(kid1.toString()); //Prints "I am child!!"
console.log(kid2.toString()); //Prints "I am child!!"
```


## Further Examples ##

Check out `demo.htm` and `import-demo.js` to see the code in action. The demo utilizes the code under the `/tests` folder to demonstrate preloading packages using the recommended package structure .

## Terms of Use ##

Free to use in any projects without notifying me, nor is credit needed (though it'd be much appreciated!). Just do not re-distribute it under anyone else's name and be sure to retain the copyright notice in the source!

## Recent Version History ##

**3.0.0**

- Overhaul of original packaging and preloading code (much cleaner read)
- Removed `module.postCompile` and added `this.inject` which accepts a single function
- Removed alternative import methods for consistency (please use the package id string)
- Added `this.import` to replace the use of ImportJS global from within packages
- New plugin system

----------

Copyrighted © 2015 by Greg McLeod

GitHub: [https://github.com/cleod9](https://github.com/cleod9)