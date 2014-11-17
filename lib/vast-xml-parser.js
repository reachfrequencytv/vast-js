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
    var handleOpenTag = function(tag) {
      var tagName = tag.name.toLowerCase();
      switch (tagName) {
        case 'vast':
          self.result = extend(self.result, tag.attributes);
          break;
        case 'ad':
          self.result.ads = self.result.ads || [];
          self.result.ads.push({
              id: dataToType(tag.attributes.id)
            , creatives: []
          });
          break;
        case 'vastadtaguri':
          var handleVastAdTagUri = function(value) {
            self.emit('vastAdTagUri', value);
            parser
              .removeAllListeners('text')
              .removeAllListeners('cdata')
            ;
          };
          parser.once('text', handleVastAdTagUri);
          parser.once('cdata', handleVastAdTagUri);
          break;
        case 'creative':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = {
              sequence: dataToType(tag.attributes.sequence)
            , adId: tag.attributes['AdID']
            , trackingEvents: {}
          };
          var handleCreativeType = function(tag) {
            creative.type = tag.name.toLowerCase();
            ad.creatives.push(creative);
          };
          parser.once('opentag', handleCreativeType);
          break;
        case 'adsystem':
        case 'adtitle':
        case 'survey':
        case 'description':
        case 'impression':
          var ad = self.result.ads[self.result.ads.length - 1];
          var attribute = tagName.replace('ad', '');
          var handleAdValue = function(value) {
            if (tagName == 'adsystem') {
              ad[attribute] = { version: tag.attributes.version };
              ad[attribute].value = value;
            } else if (tagName == 'impression') {
              ad.impressions = ad.impressions || [];
              ad.impressions.push({ id: tag.attributes.id, url: value });
            } else {
              ad[attribute] = value;
            }
            parser
              .removeAllListeners('text')
              .removeAllListeners('cdata')
            ;
          };
          parser.once('text', handleAdValue);
          parser.once('cdata', handleAdValue);
          break;
        case 'duration':
        case 'tracking':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = ad.creatives[ad.creatives.length - 1];
          var handleCreativeValue = function(value) {
            if (tagName == 'tracking') {
              creative.trackingEvents[tag.attributes.event] = creative.trackingEvents[tag.attributes.event] || [];
              creative.trackingEvents[tag.attributes.event].push(value);
            } else {
              creative[tagName] = value;
            }
            parser
              .removeAllListeners('text')
              .removeAllListeners('cdata')
            ;
          }
          parser.once('text', handleCreativeValue);
          parser.once('cdata', handleCreativeValue);
          break;
      }
    };
    var parser = sax.createStream(true) // `true` => strict parsing
      .on('opentag', handleOpenTag)
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