var ImportJS = (function () {
  var ImportJSBase = function (settings) {
    settings = settings || {};
    //This describes a single instance of ImportJS under a unqique context
    this._settings =  { debug: settings.debug || false};
    this._map = {
      packages: {}, //A map of package IDs to source function
      plugins: {} //A map of plugin IDs to ImportJS instances
    };

    this._dependencies = {
      packages: [], //A list of dependency IDs (for convenience)
      plugins: [] //A list of dependency plugin IDs (for convenience)
    };

    //ImportJS root reference will be overridden for each plugin, so we track the original references here
    this._contextStack = [];

    //Temporarily holds onto newly added packages so that we can parse their dependencies
    this._packBuffer = [];
  };

  //Set up instance variables first
  ImportJSBase.prototype = { _settings: null, _map: null, _dependencies: null, _main: null, _proxy: null, _contextStack: null, _packBuffer: null };

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
        instance._debug('Registed package dependency through regex: ' + pkgName);
        instance._map.packages[pkgName] = null; //Create the empty reference so we don't push a second time
        instance._dependencies.packages.push(pkgName); //Push into dependency list
      }
    }
    for (i = 0; i < sourcePlugins.length; i++) {
      pkgName = sourcePlugins[i].replace(pregex, '$1');
      if (typeof instance._map.plugins[pkgName] === 'undefined') {
        instance._debug('Registed plugin dependency through regex: ' + pkgName);
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
    if (this._proxy) {
      //To protect the global namespace and allow infinite plugin depth, proxy will forward the 'pack' action into a separate instance
      this._proxy.pack(id, cls);
      return;
    }
    if (!this._map.packages[id]) {
      this._dependencies.packages.push(id); //Consider this own package a dependency for the ImportJSBase instance
      this._map.packages[id] = { instance: this, src: cls, cache: null }; //Create a reference in the map for the package
      this._packBuffer.push(this._map.packages[id]); //Push this module into the package buffer to be parsed and flushed later
    }
  };

  //Checks to see if a package exists
  ImportJSBase.prototype.hasPackage = function (id) {
    return (typeof this._map.packages[id] !== 'undefined');
  };

  //Retrieves a packed package and compiles it if necessary
  ImportJSBase.prototype.unpack = function (id) {
    var self = this;
    var pkg = this._map.packages[id];
    if (!pkg) {
      throw new Error('Error, package ' + id + ' does not exist.');
    } else if (pkg.cache) {
      return pkg.cache.exports; //Already compiled
    } else {
      var bound = { 
        import: function (id) { return self.unpack.call(self, id); },
        plugin: function (id) { return self.plugin.call(self, id); } 
      };
      //Create an empty module to populate;
      pkg.cache = { exports: {}, postCompile: null };
      //Compile the module and store inside the cache
      pkg.src.call(bound, pkg.cache, pkg.cache.exports); // i.e. module: { exports: function() {} }

      //Run post-compilation func
      if(pkg.cache.postCompile)
        pkg.cache.postCompile.call(bound);

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
    var i;
    //Compile all packages
    for (i = 0; i < this._dependencies.packages; i++) {
      this.unpack(this._dependencies.packages[i]);
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
      strict: (params.strict === false) ? false : true, //Strictly verify package existence upon load
      timeout: (params.timeout) ? params.timeout : 5000, //Amount of ms to timeout
      libs: params.libs || [], //Array of extra urls to any files you want to load outside of ImportJS (Similar to using 'files' param with strict = false)
      autocompile: (params.autocompile === false) ? false : true, //ImportJS will call compile() when all items have finished loading
      entryPoint: params.entryPoint || null //Provide a package name to act as an entry point
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
    var filesArr = (typeof options.packages.length === 'number') ? options.packages : []; //User may provide array or object
    var dependencyHash = {}; //Hash to prevent loading the same parsed dependency twice
    var libsArr = options.libs;
    var packageArr = [];
    var loadedFiles = [];
    var erroredFiles = [];
    var loadedPlugins = [];
    var erroredPlugins = [];
    var dependencyIndex = 0;

    var objToPath = function(obj, filePathBuffer, pkgBuffer) {
      for(var key in obj) {
        if (typeof obj[key] === 'string') {
          filesArr.push(filePathBuffer + '/' + obj[key]); //Push the file name
          packageArr.push((pkgBuffer + '.' + key).substr(1)); //Add the package name (remove extra delimiter at string start)
          self._debug('Converted file path to package: ', filePathBuffer + '/' + obj[key], self._dependencies.packages[i]);
        } else if (typeof obj[key] === 'object') {
          objToPath(obj[key], filePathBuffer + '/' + key, pkgBuffer + '.' + key); //Drill down into the package
        } else {
          throw new Error("ImportJS Error: Paths can only contain Objects and String values.");
        }
      }
    };

    if (filesArr.length === 0) {
      //List is empty meaning no packages were provided, or this is an object (either case should handle fine)
      (function(obj, filePathBuffer, pkgBuffer) {
        //Simple anonymous function to run through the provided package tree and generate a flat list of packages and files
        for(var key in obj) {
          if (typeof obj[key] === 'string') {
            filesArr.push(filePathBuffer + '/' + obj[key]);
            packageArr.push((pkgBuffer + '.' + key).substr(1)); //Add the package name (remove extra delimiter at string start)
            self._debug('Converted file path to package: ', filePathBuffer + '/' + obj[key], self._dependencies.packages[i]);
          }
          else if (typeof obj[key] === 'object')
            objToPath(obj[key], filePathBuffer + '/' + key, pkgBuffer + '.' + key);
          else
            throw new Error("ImportJS Error: Paths can only contain Objects and String values.");
        }
      })(options.packages, options.baseUrl, '');
    } else {
      //Array was provided, simply loop through package list
      for(i = 0; i < options.packages.length; i++) {
        filesArr.push(options.baseUrl + '/' + options.packages[i].split('.').join('/') + '.js');
        packageArr.push(options.packages[i].split('/').join('.'));
        options.packages[i] = options.baseUrl + '/' + options.packages[i]; //Must prefix the baseUrl
        self._debug('Converted file path to package: ', filePathBuffer + '/' + obj[key], self._dependencies.packages[i]);
      }
    }

    if (options.entryPoint) {
      //Inject the entry point into the files list
      filesArr.push(options.baseUrl + '/' + options.entryPoint.split(':')[0].split('.').join('/') + '.js');
      packageArr.push(options.entryPoint.split(':')[0].split('/').join('.'));
      self._debug('Entry point set: ', options.entryPoint.split(':')[0].split('/').join('.'));
    }

    //Hash package names so we don't attempt to load duplicates during dependency loading
    for (i = 0; i < packageArr.length; i++) {
      dependencyHash[packageArr[i]] = true;
    }

    //To be called upon success or failure
    var finish = function (success) {
      if (success) {
        if (options.autocompile) {
          self.compile();
        }
        if (options.entryPoint) {
          //We will perform 
          var commands = options.entryPoint.split(':');
          var pkg = self.unpack(commands[0].split('/').join('.'));
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

    if (filesArr.length === 0) {
      //File list is empty so we can finish immediately
      finish(true);
    }


    //To be called right before the completion event to auto-load regex'd dependencies
    var queueDependencies = function () {
      for (var i = dependencyIndex; i < self._dependencies.packages.length; i++) {
        if (!dependencyHash[self._dependencies.packages[i]]) {
          dependencyHash[self._dependencies.packages[i]] = true;
          //This is a dependency that has been prepeared but not yet loaded
          filesArr.push(options.baseUrl + '/' + self._dependencies.packages[i].split('.').join('/') + '.js');
          packageArr.push(self._dependencies.packages[i]);
          loadScript(filesArr[i], packageArr[i]);
          self._debug('Now loading dependency: ', self._dependencies.packages[i]);
        }
        //Rememeber the last checked dependencies to save time
        dependencyIndex = i;
      }
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
              self._proxy = self._contextStack.pop(); //Put back the previous reference
              if(loadedPlugins.length >= self._dependencies.plugins.length) {
                finish(true); //Trigger finish event, all plugins loaded
                self._debug('Plugin batch load completed.');
              } else {
                nextPlugin();
              }
            };
            return function (files) {
              whenPluginReady(name, files);
            }
          };
          var errorWrapper = function (name) {
            var whenPluginError = function (files) {
              self._debug('Error loading plugin: ' + name);
              //Some problem loading the plugin
              erroredPlugins.push(name);
              self._proxy = self._contextStack.pop(); //Put back the previous reference
              finish(false);
              self._debug('Plugin batch load failed.');
            };
            return function (files) {
              whenPluginError(name, files);
            };
          }
          var nextPlugin = function () {
            //Create a new instance of ImportJS for each plugin
            var pluginName = self._dependencies.plugins[loadedPlugins.length]; //<-Length of loaded plugins can tell us what plugin to load next
            self._debug('Preparing to load plugin ' + options.baseUrl + '/plugins/' + pluginName);
            self._contextStack.push(ImportJS);
            self._proxy = new ImportJSBase(self._options);
            self._map.plugins[pluginName] = self._proxy;

            self._proxy.preload({
              baseUrl: options.baseUrl + '/plugins/' + pluginName,
              removeTags: options.removeTags,
              strict: false,
              timeout: options.timeout,
              autocompile: true,
              entryPoint: pluginName,
              ready: readyWrapper(pluginName),
              error: errorWrapper(pluginName)
            });
          };
          //Start loading
          nextPlugin();
    };

    //To be called once a script path is provided
    var loadScript = function(filePath, clsPath) {
      //Specific handling for node.js (We will merely require() the module, and store its exported value inside of ImportJS)
      if (options.require) {
        try {
          //Make sure there is a dot or slash so we don't dig into node_modules folder
          if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
            filePath = './' + filePath;
          }
          
          //Require the source and pack it into ImportJS
          var source = options.require(filePath);
          self._debug('Successfully required source file: ' + filePath);
          
          //Throw error in strict mode if class name doesn't match the definition inside the file
          if (clsPath && options.strict) {
            if (!self.hasPackage(clsPath)) {
              throw new Error("ImportJS Error: Invalid or missing package definition for " + clsPath + " (using strict)");
            }
          }

          //Mark this file as loaded
          loadedFiles.push(filePath);
        } catch(e) {
          self._debug(e.stack);
          erroredFiles.push(filePath);
          finish(false);
          self._debug('Error requiring source file: ' + filePath);
          return;
        }
        //Re-check dependencies
        self._flushPackBuffer();
        queueDependencies();

        if (loadedFiles.length === filesArr.length + libsArr.length) {
          self._debug('Finished loading self dependencies');
          //For plugin dependencies
          if (self._dependencies.plugins.length <= 0) {
            self._debug('No plugins found.');
            //Safe to return/compile now, no plugins
            finish(true);
            self._debug('Preload job complete');
          } else {
            loadPlugins();
          }
        }
        return;
      }
      var done = false;
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      var timeout = null;
      script.type = 'text/javascript';

      //Function to be run each time a script is loaded
      var loadFunc = function () {
        if (options.removeTags)
          head.removeChild(script);
        done = true;
        clearTimeout(timeout);
        //If clsPath provided and strict mode is on (no clsPath for libs)
        if (clsPath && options.strict) {
          if (!self.hasPackage(clsPath)) {
            throw new Error("ImportJS Error: Invalid or missing package definition for " + clsPath + " (using strict)");
          }
        }
        loadedFiles.push(filePath);

        //Must update dependencies list
        self._flushPackBuffer();
        queueDependencies();

        if (loadedFiles.length === filesArr.length + libsArr.length) {
          self._debug('Finished loading self dependencies');
          //For plugin dependencies
          if (self._dependencies.plugins.length <= 0) {
            //Safe to return/compile now, no plugins
            finish(true);
            self._debug('Preload job complete');
          } else {
            loadPlugins();
          }
        }
      };
      //Function to be run when something goes wrong
      var errorFunc = function() {
        if (options.removeTags)
          head.removeChild(script);

        //Append to errored file list and clear the timer
        erroredFiles.push(filePath);
        clearTimeout(timeout);

        //See if total files list has been checked and exit
        if (loadedFiles.length + erroredFiles.length >= filesArr.length + libsArr.length) {
          finish(false);
          self._debug("Error: Could not preload the following files: [" + erroredFiles.join(", ") + "]");
        }
      };

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
    };

    //Function to kick off filesArr parsing
    var loadPackageScripts = function() {
      for(var i = 0; i < filesArr.length; i++)
        loadScript(filesArr[i], packageArr[i]);
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
          autocompile: false,
          packages: [file], //Only pass in the one file provided
          ready: success,
          error: fail
        });
      };
      var success, fail;
      success = function(arr) { 
        self._debug("Finished loading library: " + arr[0]);
        loadedFiles.push(arr[0]); //Record that the file was loaded
        if (currentLib < libsArr.length) {
          loadChainer(libsArr[currentLib++], success, fail); //Chain load next script
        }  else if (filesArr.length <= 0) {
          //No other files to load
          if (typeof options.ready === 'function')
            options.ready(loadedFiles);
        } else {
          //Begin loading scripts from filesArr
          loadPackageScripts();
        }
      };
      fail = function(arr) {
        erroredFiles.push(arr[0]); //Record that the file errored
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