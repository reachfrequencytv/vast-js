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
    .on('data', function(data) {
      self.data = data;
    })
    .on('end', function() {
      self.emit('parsed', self.data);
    })
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

Vast.prototype.timeUpdate = function(value) {
  var self = this;
  if (value / self.data.ads[1].creatives[0].duration > .25)
    process.nextTick(function() {
      self.emit('firstQuartiles', self.data.ads[1].creatives[0].trackingEvents['firstQuartile']);
    });
  return self;
};

module.exports = function(url) { return new Vast(url); }