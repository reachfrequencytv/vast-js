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
  self._currentAdIndex = 0;
  self.parser = parser()
    .on('data', function(data) {
      self._data = data;
    })
    .on('end', function() {
      self.emit('parsed', clone(self._data));
    })
  ;
  // initialize tracking event listeners:
  self._setTrackingEventListeners();
  if (url)
    self.parse(url);
}
Vast.prototype.currentAd = function() {
  var self = this;
  return ((self._data || {}).ads || [])[self._currentAdIndex];
};

Vast.prototype._setTrackingEventListeners = function() {
  var self = this;
  var handleTrackingUrls = function(events) {
    self.emit('trackingEvent', events);
  }
  self.once('impressions', handleTrackingUrls);
  self.once('firstQuartile', handleTrackingUrls);
  self.once('midpoint', handleTrackingUrls);
  self.once('thirdQuartile', handleTrackingUrls);
  self.once('complete', handleTrackingUrls);
};

Vast.prototype.previousAd = function() {
  var self = this;
  if (self._currentAdIndex > 0) {
    self._currentAdIndex -= 1;
    self._setTrackingEventListeners();
  }
  return self;
};
Vast.prototype.nextAd = function() {
  var self = this;
  if (self._currentAdIndex < ((self._data || {}).ads || []).length - 1) {
    self._currentAdIndex += 1;
    self._setTrackingEventListeners();
  }
  return self;
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

Vast.prototype.impression = function() {
  var self = this;
  var ad = self._data.ads[self._currentAdIndex];
  self.emit('impressions', ad.impressions);
};

Vast.prototype.timeUpdate = function(value) {
  var self = this;
  var ad = self._data.ads[self._currentAdIndex];
  var creative = ad.creatives.filter(function(creative) {
    return creative.type == 'linear';
  })[0];
  if (!creative)
    return self; // nothing to do, no matching creative.

  var progress = value / creative.duration;
  if (progress > 0)
    self.emit('impressions', ad.impressions);
  if (progress >= .25)
    self.emit('firstQuartile', creative.trackingEvents['firstQuartile']);
  if (progress >= .5)
    self.emit('midpoint', creative.trackingEvents['midpoint']);
  if (progress >= .75)
    self.emit('thirdQuartile', creative.trackingEvents['thirdQuartile']);
  if (progress >= .99)
    self.emit('complete', creative.trackingEvents['complete']);
  return self;
};

module.exports = function(url) { return new Vast(url); }