var should = require('should')
  , path = require('path')
  , fs = require('fs')
  , http = require('http')
  , parser = require(path.join(process.cwd(), 'lib', 'vast-xml-parser'))
;

describe('VastXmlParser', function() {
  describe('#transform', function() {
    describe('- inline', function() {
      var data, ad;
      before(function(done) {
        var xml = path.join(process.cwd(), 'test', 'files', 'dfa.xml');
        fs.createReadStream(xml)
          .pipe(parser())
          .on('data', function(chunk) {
            data = chunk;
            ad = data.ads[0];
            creative = ad.creatives[0];
          })
          .on('end', done)
        ;
      });
      it('should emit a data with `vast` property', function() {
        data.should.be.ok;
      });
      it('should have the top-level VAST document properties', function() {
        data.version.should.eql('2.0');
      });
      it('should create an `ads` list', function() {
        Array.isArray(data.ads).should.be.ok;
      });
      it('should have ad.id', function() {
        ad.id.should.eql(223626102);
      });
      it('should have ad.system', function() {
        ad.system.version.should.eql('2.0');
        ad.system.value.should.eql('DART_DFA');
      });
      it('should have ad.title', function() {
        ad.title.should.eql('In-Stream Video');
      });
      it('should have ad.description', function() {
        ad.description.should.eql('A test creative with a description.');
      });
      it('should have ad.description', function() {
        ad.description.should.eql('A test creative with a description.');
      });
      it('should have ad.survey', function() {
        ad.survey.should.eql('Foo');
      });
      it('should have ad.impressions', function() {
        ad.impressions.length.should.eql(2);
      });
      it('should have ad.creatives', function() {
        ad.creatives.length.should.eql(2);
      });
      it('should have creative.sequence', function() {
        creative.sequence.should.eql(1);
      });
      it('should have creative.sequence', function() {
        creative.adId.should.not.be.ok;
      });
      it('should have creative.type', function() {
        creative.type.should.eql('linear');
      });
      it('should have creative.duration', function() {
        creative.duration.should.eql(58);
      });
      it('should have creative.trackingEvents.start', function() {
        creative.trackingEvents['start'].length.should.eql(1);
      });
      it('should have creative.trackingEvents.firstQuartile', function() {
        creative.trackingEvents['firstQuartile'].length.should.eql(2);
      });
      it('should have creative.trackingEvents.midpoint', function() {
        creative.trackingEvents['midpoint'].length.should.eql(2);
      });
      it('should have creative.trackingEvents.thirdQuartile', function() {
        creative.trackingEvents['thirdQuartile'].length.should.eql(2);
      });
      it('should have creative.trackingEvents.complete', function() {
        creative.trackingEvents['complete'].length.should.eql(2);
      });
      it('should have creative.trackingEvents.mute', function() {
        creative.trackingEvents['mute'].length.should.eql(1);
      });
      it('should have creative.trackingEvents.pause', function() {
        creative.trackingEvents['pause'].length.should.eql(1);
      });
      it('should have creative.trackingEvents.fullscreen', function() {
        creative.trackingEvents['fullscreen'].length.should.eql(2);
      });
      it('should have creative.adParameters', function() {
        creative.adParameters.should.be.ok;
      });
      it('should have creative.clickTrackings array', function() {
        Array.isArray(creative.clickTrackings).should.be.ok;
      });
      it('should have url, id attrs in clickTracking', function() {
        creative.clickTrackings[0].url.should.be.ok;
        creative.clickTrackings[0].id.should.be.ok;
      })
      it('should have creative.clickThrough object', function() {
        creative.clickThrough.url.should.be.ok;
      });
      it('should have creative.mediaFiles array', function() {
        Array.isArray(creative.mediaFiles).should.be.ok;
      });
      it('should have a mediaFile', function() {
        creative.mediaFiles[0].delivery.should.eql('progressive');
      });
    });
    describe('- wrapper', function() {
      var wrapper = path.join(process.cwd(), 'test', 'files', 'wrapper.xml')
        , dfa = path.join(process.cwd(), 'test', 'files', 'dfa.xml')
        , data;
      it('should emit a \'vastAdTagUri\' event with the url', function(done) {
        var vastAdTagUri;
        fs.createReadStream(wrapper)
          .pipe(parser())
          .once('vastAdTagUri', function(uri) { vastAdTagUri = uri; })
          .on('end', function() {
            vastAdTagUri.should.eql('http://localhost:1337');
            done();
          }).resume();
        ;
      });
      it('should handle two readables', function(done) {
        var vastAdTagUri
          , p = parser()
        ;
        fs.createReadStream(wrapper)
          .pipe(p, { end: false })
          .once('vastAdTagUri', function(uri) {
            // ignore `uri`, add another fixture file:
            fs.createReadStream(dfa).pipe(p, { end: false });
          })
          .on('data', function(chunk) {  data = chunk })
          .on('end', function() {
            data.ads[1].id.should.eql(223626102);
            done();
          })
        ;
      });
      it('should error if redirected more than `maxRedirects` times', function(done) {
        var vastAdTagUri
          , p = parser({ maxRedirects: 1 })
        ;
        fs.createReadStream(wrapper)
          .pipe(p, { end: false })
          .once('vastAdTagUri', function(uri) {
            // ignore `uri`, add another fixture file:
            fs.createReadStream(dfa).pipe(p, { end: false });
          })
          .on('error', function(err) {
            err.code.should.eql('EMAXREDIRECTS');
            done();
          })
        ;
      });
    });
  });
});