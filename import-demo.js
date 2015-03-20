/*
Copyright (c) 2013 Greg McLeod  (Email: cleod9{at}gmail.com)

The below code demonstrates how to use ImportJS.

*/

//Print function for testing purposes
function print(str) {
	document.getElementById('output').innerHTML += str.split('\n').join('<br />') + "<br />";
}

//On DOM load

//How to preload files
ImportJS._settings.debug = true; //<-Hack if you want debug details
ImportJS.preload({
	baseUrl: 'tests',
  packages: ['Main.js'],
  /* The below field is an alternative to the above field, and can allow you to use parse: false  */
  /*packages: {
    Main: 'Main.js',
    Simple: 'Simple.js',
    circular: {
      CircularDepA: 'CircularDepA.js',
      CircularDepB: 'CircularDepB.js'
    },
    inheritance: {
      Child: 'Child.js',
      Parent: 'Parent.js'
    }
  },
  plugins: [
    'backbone',
    'jquery'
  ],*/
  //parse: false, //Turns of regexing function source code to find dependencies
  libs: [
    'dummy.lib1.js',
    'dummy.lib2.js',
    'dummy.lib3.js'
  ],
	//Pass as an object to describe entire package tree
	//Note: Keys are either folder names or class names, and values are contents or file names
	entryPoint: 'Main:new',
	ready: function(arr) {
		console.log('Fully loaded', arr);

    print('\nLoaded files: [ ' + arr.join(', ') + ']');
	},
	error: function(arr) {
		//This function will be called upon error
		print('Error preloading files: [' + arr.join(', ') + ']');
	}
});