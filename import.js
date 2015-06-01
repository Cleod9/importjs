/*******************************
  ImportJS Version 3.0.2
  
    A basic package-structuring import system for JavaScript Objects.
  
  The MIT License (MIT)

  Copyright (c) 2015 Greg McLeod <cleod9{at}gmail.com>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

  It is requested that you maintain all or part of this copyright notice even in the minified version.
*******************************/
var ImportJS = (function () {
  //Acts as a proxy to the appropriate ImportJSBase instance, which can change as various plugins are imported
  var _proxyStack = [];

  //The Package class represents a single "module" of code which is later to be compiled
  var ImportJSPackage = function (id, instance, src) {
    this.id  = id;
    this.instance = instance;
    this.src = src;
    this.compiled = false;
    this.completed = false;
  };
  //String identifier for the package
  ImportJSPackage.prototype.id = null;
  //ImportJSBase reference for the package
  ImportJSPackage.prototype.instance = null;
  //Source code function for the package
  ImportJSPackage.prototype.src = null;
  //Cached return value from the executed source code
  ImportJSPackage.prototype.cache = null;
  //ImportJSContext Reference
  ImportJSPackage.prototype.context = null;
  //Injector function that will be run after the compilation step
  ImportJSPackage.prototype.injector = null;
  //Whether or not the package has been compiled yet
  ImportJSPackage.prototype.compiled = false;
  //Whether or not the package's post-compilation function (injector) has been run yet
  ImportJSPackage.prototype.completed = false;

  //The Context class acts as the "this" object for a package, containing several utilities
  var ImportJSContext = function (pkg) {
    this.pkg = pkg;
  };
  //References the package 
  ImportJSContext.prototype.pkg = null; 
  //Proxies import initialization for this ImportJSBase instance
  ImportJSContext.prototype.import = function (id) {
    return this.pkg.instance.unpack.call(this.pkg.instance, id);
  };
  //Proxies plugin initialization for this ImportJSBase instance
  ImportJSContext.prototype.plugin = function (id) {
    return this.pkg.instance.plugin.call(this.pkg.instance, id); 
  };
  //Assigns an injector function to be run during post-compilation of packages
  ImportJSContext.prototype.inject = function (fn) {
    //Only accept functions as injectors
    if (typeof fn === 'function') {
      this.pkg.injector = fn;
    }
  };

  //Describes a single instance of ImportJS under a unique context. Plugins have a unique ImportJSBase object from the main application.
  var ImportJSBase = function (settings) {
    settings = settings || {};

    //Contains configuration options for ImportJS. Only current setting is for console debug output
    this._settings =  { debug: settings.debug || false};

    //A hash map that contains a key for a plugins hash and another key for a normal packages hash.
    this._map = {
      packages: {}, //A map of package IDs to ImportJSPackage instances
      plugins: {} //A map of plugin IDs to ImportJSPackage instances
    };

    //A hash map similar to _map for faster enumeration of ImportJSPackage instances; it contains string array for package and plugin IDs
    this._dependencies = {
      packages: [], //A list of dependency ID strings (for convenience)
      plugins: [] //A list of dependency plugin IDs strings (for convenience)
    };

    //Used when defining an entry point for the application via the preload() function
    this._main = null;
    //Temporarily holds onto newly added packages so that we can parse their dependencies
    this._packBuffer = [];
  };

  ImportJSBase.prototype._settings = null;
  ImportJSBase.prototype._map = null;
  ImportJSBase.prototype._dependencies = null;
  ImportJSBase.prototype._main = null;
  ImportJSBase.prototype._packBuffer = null;


  //Helper method for parsing the source text dependencies
  var _grabDependencies = function (instance, sourceText) {
    var i;
    var iregex = /this.import\(['"](.*?)['"]\)/g;
    var pregex = /this.plugin\(['"](.*?)['"]\)/g;
    var sourceImports = sourceText.match(iregex) || [];
    var sourcePlugins = sourceText.match(pregex) || [];
    var pkgName = null;
    for (i = 0; i < sourceImports.length; i++) {
      pkgName = sourceImports[i].replace(iregex, '$1');
      if (typeof instance._map.packages[pkgName] === 'undefined') {
        instance._debug('Registered package dependency through regex: ' + pkgName);
        instance._map.packages[pkgName] = null; //Create the empty reference so we don't push a second time
        instance._dependencies.packages.push(pkgName); //Push into dependency list
      }
    }
    for (i = 0; i < sourcePlugins.length; i++) {
      pkgName = sourcePlugins[i].replace(pregex, '$1');
      if (typeof instance._map.plugins[pkgName] === 'undefined') {
        instance._debug('Registered plugin dependency through regex: ' + pkgName);
        instance._map.plugins[pkgName] = null; //Create the empty reference so we don't push a second time
        instance._dependencies.plugins.push(pkgName); //Push into dependency list
      }
    }
  };

  //Parses the dependencies of all packages in the buffer and clears out the buffer
  ImportJSBase.prototype._flushPackBuffer = function () {
    while (this._packBuffer.length > 0) {
      //Parse the plugin/package dependencies from the source text
      _grabDependencies(this._packBuffer[0].instance, this._packBuffer[0].src.toString());
      this._packBuffer.splice(0, 1);
    }
  };

  //Debug print helper
  ImportJSBase.prototype._debug = function () {
    if (this._settings.debug) {
      console.log('[ImportJS]', arguments);
    }
  };

  //Stores a package
  ImportJSBase.prototype.pack = function (id, cls) {
    var context = (_proxyStack[0] || this);
    if (!context._map.packages[id]) {
      context._dependencies.packages.push(id); //Consider this own package a dependency for the ImportJSBase instance
      context._map.packages[id] = new ImportJSPackage(id, context, cls); //Create a reference in the map for the package
      context._packBuffer.push(context._map.packages[id]); //Push this module into the package buffer to be parsed and flushed later
    }
  };

  //Checks to see if a package exists
  ImportJSBase.prototype.hasPackage = function (id, loaded) {
    loaded = (loaded === true) ? true : false;
    return ((loaded) ? this._map.packages[id] : typeof this._map.packages[id] !== 'undefined') ? true : false;
  };

  //Retrieves a packed package and compiles it if necessary
  ImportJSBase.prototype.unpack = function (id) {
    var self = this;
    var pkg = this._map.packages[id];
    if (!pkg) {
      throw new Error('Error, package ' + id + ' does not exist.');
    } else if (pkg.cache) {
      if (!pkg.compiled) {
        throw new Error('Error, package ' + id + ' has not yet been compiled.');
        return null; //Pre-mature unpack
      } else {
        return pkg.cache.exports; //Already compiled
      }
    } else {
      var context = new ImportJSContext(pkg);
      //Create an empty module to populate (or keep the current if it was created already which can happen in a circular import)
      pkg.cache = pkg.cache || { exports: {} };
      
      //Compile the module and store inside the cache
      pkg.src.call(context, pkg.cache, pkg.cache.exports); // i.e. module: { exports: function() {} }

      //Signify this package is ready to be unpacked by other classes now that module is available
      pkg.compiled = true;

      //Store the context for use by the injector function later
      pkg.context = context;

      //Return exports
      return pkg.cache.exports;
    }
  };

  //Retrieves a reference to a plugin ImportJS instance
  ImportJSBase.prototype.plugin = function (id) {
    if (this._map.plugins[id]) {
      return this._map.plugins[id].unpack(id);
    } else {
      throw new Error("ImportJS Error: Plugin " + id + " does not exist.");
    }
  };
  ImportJSBase.prototype.compile = function () {
    var i, j;
    //Compile all packages
    for (i = 0; i < this._dependencies.packages.length; i++) {
      this.unpack(this._dependencies.packages[i]);
    }
    //Run post-compilation functions
    for (i = 0; i < this._dependencies.packages.length; i++) {
      j = this._dependencies.packages[i];
      if (this._map.packages[j].injector && !this._map.packages[j].completed) {
        this._map.packages[j].completed = true;
        this._map.packages[j].injector.call(this._map.packages[j].context);
      } else {
        this._map.packages[j].completed = true;
      }
    }
  };
  ImportJSBase.prototype.preload = function (params) {
    if (typeof params != 'object')
      throw new Error("ImportJS Error: No options object supplied.");
    
    var options = {
      require: params.require || null,
      baseUrl: params.baseUrl || '', //Base path for the preload
      packages: params.packages || [], //Object or Array of file paths. Use relative to the baseUrl, recommended not to use parent directories ('..')
      plugins: params.plugins || [], //Object or Array of file paths. Use relative to the baseUrl, recommended not to use parent directories ('..')
      ready: params.ready || null,  //Ready callback
      error: params.error || null, //Error callback
      removeTags: (params.removeTags === false) ? false : true, //Remove generated from head as they are loaded
      strict: (params.strict === true) ? true : false, //Strictly verify package existence upon load
      timeout: (params.timeout) ? params.timeout : 5000, //Amount of ms to timeout
      libs: params.libs || [], //Array of extra urls to any files you want to load outside of ImportJS (Similar to using 'files' param with strict = false)
      autoCompile: (params.autoCompile === false) ? false : true, //ImportJS will call compile() when all items have finished loading
      entryPoint: params.entryPoint || null, //Provide a package name to act as an entry point
      parse: (params.parse === false) ? false : true //If package functions should have their import statements regex'd to dynamically find dependencies
    };
    
    //Fix path if needed
    if (options.baseUrl === './' || options.baseUrl === '') {
      options.baseUrl = '.'; //Force dot character for relative pathing
    }
    if (options.baseUrl.lastIndexOf('/') === options.baseUrl.length - 1) {
      options.baseUrl = options.baseUrl.substr(0, options.baseUrl.length - 1); //Fix trailing slash
    }

    var i;
    var self = this;
    var filesArr = []; //User may provide array or object
    var pluginsArr = []; //User may provide array
    var dependencyHash = {}; //Hash to prevent making a record of same parsed dependency twice
    var libsArr = options.libs;
    var loadedFiles = [];
    var erroredFiles = [];
    var loadedPlugins = [];
    var erroredPlugins = [];
    var dependencyIndex = 0;
    var remainingFiles = libsArr.length;

    var objToPath = function(obj, filePathBuffer, pkgBuffer) {
      for(var key in obj) {
        if (typeof obj[key] === 'string') {
          var path = filePathBuffer + '/' + obj[key];
          filesArr.push({ 
            path: path, //File path
            pkg: (path.split(options.baseUrl + '/')[1] || '').replace(/\//g, ".").replace(/\.js$/g, '') //Add the package name with proper formatting
          });
          remainingFiles++;
          self._debug('Converted file path to package: ', filesArr[filesArr.length-1].path, filesArr[filesArr.length-1].pkg);
        } else if (typeof obj[key] === 'object') {
          //Drill down into the package
          objToPath(obj[key], filePathBuffer + '/' + key, (pkgBuffer) ? pkgBuffer + '.' + key : null);
        } else {
          throw new Error("ImportJS Error: Paths can only contain Objects and String values.");
        }
      }
    };

    //Converts packages list to loading queue
    objToPath(options.packages, options.baseUrl, (typeof options.packages === 'object') ? '' : null);

    //To be called upon success or failure
    var hasFinished = false;
    var finish = function (success) {
      //Prevent double execution (can occur when loading plugins)
      if (hasFinished) {
        return;
      } else {
        hasFinished = true;
      }
      if (success) {
        if (options.autoCompile) {
          self.compile();
        }
        if (options.entryPoint) {
          //We will perform 
          var commands = options.entryPoint.split(':');
          var pkg = self.unpack(commands[0].split('/').join('.'));
          self._debug('Entering entry point: ', commands, pkg);
          if (commands.length > 1) {
            self._main = pkg;
            if (commands[1] === 'new') {
              self._main = new pkg(); 
            } else {
              self._main = pkg;
              pkg[commands[1]](); //Run a static function from the module specified by package:command
            }
          } else {
            self._main = pkg; //Default behavior assumes you want to return a static package object
          }
        }
        if (typeof options.ready === 'function') {
          options.ready(loadedFiles);
        }
      } else {
        if (typeof options.error === 'function') {
          options.error(erroredFiles);
        }
      }
    };

    if (remainingFiles === 0) {
      //File list is empty so we can finish immediately
      finish(true);
    }


    //To be called right before the completion event to auto-load regex'd dependencies
    var queueDependencies = function () {
      //Add any manually specified plugins
      while (options.plugins.length > 0) {
        if (typeof self._map.plugins[options.plugins[0]] === 'undefined') {
          self._dependencies.plugins.push(options.plugins[0]);
        }
        options.plugins.splice(0, 1);
      }
      //Add any newly discovered dependencies
      for (var i = dependencyIndex; i < self._dependencies.packages.length; i++) {
        if (!dependencyHash[self._dependencies.packages[i]]) {
          dependencyHash[self._dependencies.packages[i]] = true;
          //This is a dependency that has been prepeared but not yet loaded
          filesArr.push({
            path: options.baseUrl + '/' + self._dependencies.packages[i].split('.').join('/') + '.js',
            pkg: self._dependencies.packages[i]
          });
          remainingFiles++;
          loadScript(filesArr[filesArr.length-1].path, filesArr[filesArr.length-1].pkg);
        }
      }
      //Rememeber the last checked dependencies to save time
      dependencyIndex = i;
    };

    //To be called when plugin loading starts
    var loadPlugins = function () {
      self._debug('Initating plugin load...');
      //Preload the plugin based on  the current base URL and plugin directory (extracted callbacks to keep out of the loop)
      var readyWrapper = function (name) {
        var whenPluginReady = function (files) {
          self._debug('Finished loading plugin: ' + name);
          //The plugin has successsfully loaded and been compiled
          loadedPlugins.push(name);
          _proxyStack.shift();
          if(loadedPlugins.length >= self._dependencies.plugins.length) {
            finish(true); //Trigger finish event, all plugins loaded
            self._debug('Plugin batch load completed.');
          } else {
            nextPlugin();
          }
        };
        return function (files) {
          whenPluginReady(files);
        }
      };
      var errorWrapper = function (name) {
        var whenPluginError = function (files) {
          self._debug('Error loading plugin: ' + name);
          //Some problem loading the plugin
          erroredPlugins.push(name);
          _proxyStack.shift();
          finish(false);
          self._debug('Plugin batch load failed.');
        };
        return function (files) {
          whenPluginError(files);
        };
      }
      var nextPlugin = function () {
        //Create a new instance of ImportJS for each plugin
        var pluginName = self._dependencies.plugins[loadedPlugins.length]; //<-Length of loaded plugins can tell us what plugin to load next
        self._debug('Preparing to load plugin ' + options.baseUrl + '/plugins/' + pluginName);
        _proxyStack.unshift(new ImportJSBase(self._settings));
        self._map.plugins[pluginName] = _proxyStack[0];

        _proxyStack[0].preload({
          baseUrl: options.baseUrl + '/plugins/' + pluginName,
          removeTags: options.removeTags,
          strict: false,
          timeout: options.timeout,
          autoCompile: true,
          packages: [pluginName + '.js'],
          ready: readyWrapper(pluginName),
          error: errorWrapper(pluginName)
        });
      };
      //Start loading
      nextPlugin();
    };

    //To be called once a script path is provided
    var loadScript = function(filePath, clsPath) {
      var head;
      var script;
      var timeout;
      var done = false;
      //Only load if not already registered in ImportJS
      var alreadyLoaded = self.hasPackage(clsPath, true);

      if (!alreadyLoaded) {
        self._debug('Now loading dependency: ', filePath, clsPath);
      } else {
        self._debug('Already loaded dependency: ', filePath, clsPath);
      }

      //Function to be run each time a script is loaded
      var loadFunc = function () {
        if (!alreadyLoaded && timeout) {
          clearTimeout(timeout);
        }
        if (script && options.removeTags) {
          head.removeChild(script);
        }

        done = true;
        //If clsPath provided and strict mode is on (no clsPath for libs)
        if (clsPath && options.strict) {
          if (!self.hasPackage(clsPath)) {
            throw new Error("ImportJS Error: Invalid or missing package definition for " + clsPath + " (using strict)");
          }
        }
        loadedFiles.push(filePath);
        remainingFiles--;

        //Must update dependencies list
        if (options.parse) {
          self._flushPackBuffer();
        }
        queueDependencies();

        if (remainingFiles === 0) {
          self._debug('Finished loading self dependencies');
          //For plugin dependencies
          if (self._dependencies.plugins.length <= 0) {
            self._debug('No plugins specified.');
            //Safe to return/compile now, no plugins
            finish(true);
            self._debug('Preload job complete');
          } else {
            //Hack to prevent plugins from loading multiple times if already loaded dependencies are being checked
            if (alreadyLoaded) {
              return;
            }
            loadPlugins();
          }
        }
      };
      //Function to be run when something goes wrong
      var errorFunc = function() {
        if (script && options.removeTags)
          head.removeChild(script);

        //Append to errored file list and clear the timer
        erroredFiles.push(filePath);
        remainingFiles--;
        clearTimeout(timeout);

        //See if total files list has been checked and exit
        if (remainingFiles === 0) {
          finish(false);
          self._debug("Error: Could not preload the following files: [" + erroredFiles.join(", ") + "]");
        }
      };

      //Specific handling for node.js (We will merely require() the module, and store its exported value inside of ImportJS)
      if (options.require) {
        try {
          //Make sure there is a dot or slash so we don't dig into node_modules folder
          if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
            filePath = './' + filePath;
          }
          
          //Require the source and pack it into ImportJS
          var source = (alreadyLoaded) ? null : options.require(filePath);
          self._debug('Successfully required source file: ' + filePath);
          
          //Throw error in strict mode if class name doesn't match the definition inside the file
          if (clsPath && options.strict) {
            if (!self.hasPackage(clsPath)) {
              throw new Error("ImportJS Error: Invalid or missing package definition for " + clsPath + " (using strict)");
            }
          }
        } catch(e) {
          self._debug(e.stack);
          self._debug('Error requiring source file: ' + filePath);
          errorFunc();
          return;
        }

        loadFunc();
      } else {
        if (alreadyLoaded) {
          loadFunc();
        } else {
          head = document.getElementsByTagName('head')[0];
          script = document.createElement('script');
          timeout = null;
          script.type = 'text/javascript';

          //Set a timeout to allow graceful exit
          timeout = setTimeout(function() { 
            self._debug("Error: Timed out on file: " + filePath);
            errorFunc();
          }, options.timeout);

          //Prep the script load detection
          script.onreadystatechange = function () {
            if (!done && (!script.readyState || this.readyState === 'complete' || this.readyState === 'loaded')) {
              loadFunc();
            }
          };
          script.onload = loadFunc;
          script.onerror = errorFunc;
          //Add to DOM to start the loading
          script.src = filePath;
          head.appendChild(script);
        }
      }
    };

    //Function to kick off filesArr parsing
    var loadPackageScripts = function() {
      for(var i = 0; i < filesArr.length; i++) {
        loadScript(filesArr[i].path, filesArr[i].pkg);
      }
    };
    
    //Start with the libs (if there are any)
    if (libsArr.length > 0) {
      var currentLib = 0;
      //Create new preload job using hard-coded options to ensure load order (inherits original options)
      var loadChainer = function(file, success, fail) {
        self._debug("Loading library: " + file);
        self.preload({
          baseUrl: options.baseUrl,
          removeTags: options.removeTags,
          strict: false,
          timeout: options.timeout,
          autoCompile: false,
          packages: [file], //Only pass in the one file provided
          ready: success,
          error: fail,
          parse: false
        });
      };
      var success, fail;
      success = function(arr) { 
        self._debug("Finished loading library: " + arr[0]);
        loadedFiles.push(arr[0]); //Record that the file was loaded
        remainingFiles--;
        if (currentLib < libsArr.length) {
          loadChainer(libsArr[currentLib++], success, fail); //Chain load next script
        }  else if (filesArr.length <= 0) {
          //No other files to load
          finish(true);
        } else {
          //Begin loading scripts from filesArr
          loadPackageScripts();
        }
      };
      fail = function(arr) {
        erroredFiles.push(arr[0]); //Record that the file errored
        remainingFiles--;
        self._debug("Error: Could not preload the following libs: [" + arr.join(", ") + "]");
        finish(false);
      };
      //Execute the preload chainer
      loadChainer(libsArr[currentLib++], success, fail);
    } else {
      //Begin loading scripts from filesArr
      loadPackageScripts();
    }
  };

  return new ImportJSBase();
})();