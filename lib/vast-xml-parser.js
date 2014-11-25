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
            if (/companionads/i.test(tag.name))
              creative.type = 'companionAd';
            else
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
        case 'adparameters':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = ad.creatives[ad.creatives.length - 1];
          var attribute = tagName.replace('adparameters', 'adParameters');
          var handleCreativeValue = function(value) {
            if (tagName == 'tracking') {
              creative.trackingEvents[tag.attributes.event] = creative.trackingEvents[tag.attributes.event] || [];
              creative.trackingEvents[tag.attributes.event].push({ url: value, type: tag.attributes.event });
            } else if (tagName == 'duration') {
              creative[attribute] = value.split(':')
                .reverse().reduce(function(memo, value, idx) {
                  return memo + parseInt(value) * Math.pow(60, idx);
                }, 0)
              ;
            } else {
              creative[attribute] = value;
            }
            parser
              .removeAllListeners('text')
              .removeAllListeners('cdata')
            ;
          }
          parser.once('text', handleCreativeValue);
          parser.once('cdata', handleCreativeValue);
          break;
        case 'clickthrough':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = ad.creatives[ad.creatives.length - 1];
          var handleClickThroughValue = function(value) {
            creative.clickThrough = { url: value };
          };
          parser.once('text', handleClickThroughValue);
          parser.once('cdata', handleClickThroughValue);
          break;
        case 'clicktracking':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = ad.creatives[ad.creatives.length - 1];
          creative.clickTrackings = creative.clickTrackings || [];
          var handleClickTrackingValue = function(value) {
            var data = { url: value };
            if (tag.attributes.id)
              data.id = tag.attributes.id;
            creative.clickTrackings.push(data);
          };
          parser.once('text', handleClickTrackingValue);
          parser.once('cdata', handleClickTrackingValue);
          break;
        case 'mediafile':
          var ad = self.result.ads[self.result.ads.length - 1];
          var creative = ad.creatives[ad.creatives.length - 1];
          creative.mediaFiles = creative.mediaFiles || [];
          var handleMediaFileValue = function(value) {
            creative.mediaFiles.push(extend({ url: value }, tag.attributes));
          };
          parser.once('text', handleMediaFileValue);
          parser.once('cdata', handleMediaFileValue);
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