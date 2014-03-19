ImportJS.pack('underscore', function(module, exports) {
  //Fake version of Underscore, we'll just expose a version number
  var _ = { VERSION: '1.6.0' };

  module.exports = _;
});