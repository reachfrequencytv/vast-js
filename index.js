var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')
  , hyperquest = require('hyperquest')
  , clone = require('clone')
  , parser = require('./lib/vast-xml-parser')
;

inherits(Vast, EventEmitter);
function Vast(url) {
  var self = this;
  EventEmitter.call(self);
  var handleTrackingUrls = function(urls) {
    (urls || []).forEach(function(url) { hyperquest(url) });
  };
  self.once('firstQuartiles', handleTrackingUrls);
  self.once('midpoints', handleTrackingUrls);
  self.once('thirdQuartiles', handleTrackingUrls);
  self.once('completes', handleTrackingUrls);

  self.parser = parser()
    .on('data', function(data) {
      self._data = data;
    })
    .on('end', function() {
      self.emit('parsed', clone(self._data));
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
  var duration = self._data.ads[0].creatives[0].duration;
  var progress = value / duration;
  if (value / self._data.ads[0].creatives[0].duration >= .25)
    self.emit('firstQuartiles', self._data.ads[0].creatives[0].trackingEvents['firstQuartiles']);
  if (value / self._data.ads[0].creatives[0].duration >= .5)
    self.emit('midpoints', self._data.ads[0].creatives[0].trackingEvents['midpoints']);
  if (value / self._data.ads[0].creatives[0].duration >= .75)
    self.emit('thirdQuartiles', self._data.ads[0].creatives[0].trackingEvents['thirdQuartiles']);
  if (value / self._data.ads[0].creatives[0].duration >= .99)
    self.emit('completes', self._data.ads[0].creatives[0].trackingEvents['completes']);
  return self;
};

module.exports = function(url) { return new Vast(url); }