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
	//How to preload files
	ImportJS._settings.debug = true;
	ImportJS.preload({
		baseUrl: 'tests',
		//Pass as an object to describe entire package tree
		//Note: Keys are either folder names or class names, and values are contents or file names
		entryPoint: 'Main',
		ready: function(arr) {
			console.log('fully loaded', arr);
		},
		error: function(arr) {
			//This function will be called upon error
			print('Error preloading files: [' + arr.join(', ') + ']');
		}
	});
}