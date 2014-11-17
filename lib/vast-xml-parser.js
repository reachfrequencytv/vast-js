var Transform = require('stream').Transform
  , sax = require('sax')
  , inherits = require('inherits')
  , extend = require('util-extend')
  , dataToType = require('./data-to-type')
  , DEFAULTS = {
      maxRedirects: 10
    }
;

inherits(VastXmlParser, Transform);
function VastXmlParser(options) {
  var self = this
    , sources = 0
    , redirects = 0
  ;
  self.settings = extend(DEFAULTS, options);
  Transform.call(self, { objectMode: true });
  self.result = {};
  self.on('pipe', function(source) {
    sources += 1;
    redirects += 1;
    if (redirects > self.settings.maxRedirects) {
      var err = new Error('Too many redirects');
      err.code = 'EMAXREDIRECTS';
      return self.emit('error', err);
    }
      
    var parser = sax.createStream(true) // `true` => strict parsing
      .on('opentag', function(tag) {
        switch (tag.name.toLowerCase()) {
          case 'vast':
            self.result = extend(self.result, tag.attributes); 
            break;
          case 'ad':
            self.result.ads = self.result.ads || [];
            self.result.ads.push({ id: dataToType(tag.attributes.id) });
            break;
          case 'vastadtaguri':
            parser.once('text', self.emit.bind(self, 'vastAdTagUri'));
            parser.once('cdata', self.emit.bind(self, 'vastAdTagUri'));
            break;
        }
      })
      .on('closetag', function() { parser.removeAllListeners(); })
    ;
    source
      .on('data', parser.write.bind(parser))
      .on('end', function() { 
        parser.once('end', function() {
          if (--sources < 1)
            self.end();
        }).end();
      })
    ;
  });
};

VastXmlParser.prototype._flush = function(done) {
  this.push(this.result);
  done();
};

module.exports = function(options) { return new VastXmlParser(options) };