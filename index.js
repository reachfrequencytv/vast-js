var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')
  , hyperquest = require('hyperquest')
  , parser = require('./lib/vast-xml-parser')
;

inherits(Vast, EventEmitter);
function Vast(url) {
  EventEmitter.call(this);
  if (url)
    this.parse(url);
}
Vast.prototype.parse = function(url) {
  var self = this;
  hyperquest(url)
    .pipe(parser())
    .on('data', function(data) {
      self.data = data
    })
    .on('end', function() {
      self.emit('parsed', self.data)
    })
  ;
};

module.exports = function(url) { return new Vast(url); }