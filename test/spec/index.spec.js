var should  = require('should')
  , path = require('path')
  , http = require('http')
  , fs = require('fs')
  , vast = require(path.join(process.cwd(), 'index'))
;

describe('vast', function() {
  var dfa = path.join(process.cwd(), 'test', 'files', 'dfa.xml')
    , wrapper = path.join(process.cwd(), 'test', 'files', 'wrapper.xml')
  http.createServer(function(req, res) {
    fs.createReadStream(dfa)
      .pipe(res);
  }).listen(1337).unref();
  http.createServer(function(req, res) {
    fs.createReadStream(wrapper)
      .pipe(res);
  }).listen(1338).unref();
  describe('#ctor', function() {
    it('should construct', function() {
      vast().should.be.ok;
    });
    it('should be an EventEmitter', function() {
      vast().on.should.be.ok;
      vast().removeListener.should.be.ok;
    });
    it('should have a parser, with settings', function() {
      vast().parser.settings.maxRedirects.should.eql(10);
    });
    it('should allow to cycle through next ad indices', function() {
      vast().nextAd().nextAd().nextAd()._currentAdIndex.should.eql(0);
    });
    it('should allow to cycle through prevoius ad indices', function() {
      vast().previousAd().previousAd().previousAd()._currentAdIndex.should.eql(0);
    })
  });
  describe('#parse', function() {
    it('should parse an dfa file', function(done) {
      vast('http://127.0.0.1:1337')
        .on('parsed', function(data) { done() })
      ;
    });
    it('should redirect a wrapper response', function(done) {
      vast('http://127.0.0.1:1338')
        .on('parsed', function(data) {
          data.ads[1].id.should.eql(223626102);
          done();
        })
      ;
    });
  });
  describe('#timeUpdate', function() {
    var firstQuartile = midpoint = thirdQuartile = complete = impression = 0
      , ad
    ;
    beforeEach(function() {
      http.createServer(function(req, res) {
        if (/impression/.test(req.url))
          impression += 1;
        if (/firstQuartile/.test(req.url))
          firstQuartile += 1;
        if (/midpoint/.test(req.url))
          midpoint += 1;
        if (/thirdQuartile/.test(req.url))
          thirdQuartile += 1;
        if (/complete/.test(req.url))
          complete += 1;
        res.end('ok!');
      }).listen(1339).unref();
      ad = vast();
      ad._data = {
        ads: [
          { 
            impressions: [{ url: 'http://localhost:1339/impression' }],
            creatives: [
              {
                type: 'linear',
                duration: 4,
                trackingEvents: {
                  firstQuartile: [{ url: 'http://localhost:1339/firstQuartile' }],
                  midpoint: [{ url: 'http://localhost:1339/midpoint' }],
                  thirdQuartile: [{ url: 'http://localhost:1339/thirdQuartile' }],
                  complete: [{ url: 'http://localhost:1339/complete' }]
                }
              }
            ]
          },
        ]
      };
    })
    it('should handle timeUpdate invocations', function(done) {
      ad.timeUpdate(4);
      setTimeout(function() {
        impression.should.eql(1);
        firstQuartile.should.eql(1);
        midpoint.should.eql(1);
        thirdQuartile.should.eql(1);
        complete.should.eql(1);
        done();
      }, 10); // small delay to let requests finish.
    });
  });
});