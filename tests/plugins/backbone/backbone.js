ImportJS.pack('backbone', function(module, exports) {
	var _ = this.plugin('underscore');

  var Backbone = { VERSION: '1.1.2', _: _ };
	//Fake version of Backbone, we'll just expose a version number
	module.exports = Backbone;
});