ImportJS.pack('underscore', function(module) {
	var Backbone = this.plugin('backbone');
	//This package will return Simple when unpacked
	module.exports.toString = function () {
		return 'Underscore version 1';
	}
	module.exports.Backbone = Backbone;
});