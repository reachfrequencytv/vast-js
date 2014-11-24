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
  self._currentAdIndex = 0;
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

Vast.prototype.previousAd = function() {
  var self = this;
  if (self._currentAdIndex > 0)
    self._currentAdIndex -= 1;
  else
    console.error('vast.js: No more `previous` ads. Currently at first ad.');
};
Vast.prototype.nextAd = function() {
  var self = this;
  if (self._currentAdIndex < self._data.ads.length - 1)
    self._currentAdIndex += 1;
  else
    console.error('vast.js: No more `next` ads. Currently at last ad.');
};

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
  var ad = self._data.ads[self._currentAdIndex];
  var creative = ad.creatives.filter(function(creative) {
    return creative.type == 'linear';
  })[0];
  if (!creative)
    return; // nothing to do, no matching creative.

  var progress = value / creative.duration;
  if (progress >= .25)
    self.emit('firstQuartiles', creative.trackingEvents['firstQuartiles']);
  if (progress >= .5)
    self.emit('midpoints', creative.trackingEvents['midpoints']);
  if (progress >= .75)
    self.emit('thirdQuartiles', creative.trackingEvents['thirdQuartiles']);
  if (progress >= .99)
    self.emit('completes', creative.trackingEvents['completes']);
  return self;
};

module.exports = function(url) { return new Vast(url); }