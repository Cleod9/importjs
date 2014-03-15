ImportJS.pack('backbone', function(module) {
	var _ = this.plugin('underscore');

	//This package will return Simple when unpacked
	module.exports.toString = function () {
		return 'Backbone version 1';
	};
	module.exports._ = _;
});