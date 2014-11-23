var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')
  , hyperquest = require('hyperquest')
  , parser = require('./lib/vast-xml-parser')
;

inherits(Vast, EventEmitter);
function Vast(url) {
  var self = this;
  EventEmitter.call(self);
  self.parser = parser()
    .on('data', function(data) { self.data = data })
    .on('end', function() { self.emit('parsed', self.data); })
  ;
  if (url)
    self.parse(url);
}
Vast.prototype.parse = function(url) {
  var self = this;
  function parseVastAdTagUri(uri) {
    hyperquest({ uri: uri, withCredentials: false })
      .pipe(self.parser, { end: false })
      .on('vastAdTagUri', parseVastAdTagUri)
    ;
  };
  parseVastAdTagUri(url);
};

module.exports = function(url) { return new Vast(url); }