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
    var firstQuartiles = midpoints = thirdQuartiles = completes = 0
      , ad
    ;
    beforeEach(function() {
      http.createServer(function(req, res) {
        if (/firstQuartile/.test(req.url))
          firstQuartiles += 1;
        if (/midpoint/.test(req.url))
          midpoints += 1;
        if (/thirdQuartile/.test(req.url))
          thirdQuartiles += 1;
        if (/complete/.test(req.url))
          completes += 1;
        res.end('ok!');
      }).listen(1339).unref();
      ad = vast();
      ad._data = {
        ads: [
          { creatives: [
              {
                type: 'linear',
                duration: 4,
                trackingEvents: {
                  firstQuartiles: ['http://localhost:1339/firstQuartile'],
                  midpoints: ['http://localhost:1339/midpoint'],
                  thirdQuartiles: ['http://localhost:1339/thirdQuartile'],
                  completes: ['http://localhost:1339/complete']
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
        firstQuartiles.should.eql(1);
        midpoints.should.eql(1);
        thirdQuartiles.should.eql(1);
        completes.should.eql(1);
        done();
      }, 50); // small delay to let requests finish.
    });
  });
});