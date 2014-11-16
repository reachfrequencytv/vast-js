var should  = require('should')
  , path = require('path')
  , http = require('http')
  , fs = require('fs')
  , vast = require(path.join(process.cwd(), 'index'))
;

describe('vast', function() {
  http.createServer(function(req, res) {
    var xml = path.join(process.cwd(), 'test', 'files', 'dfa.xml');
    fs.createReadStream(xml)
      .pipe(res)
    ;
  }).listen(1337).unref();
  describe('#ctor', function() {
    it('should construct', function() {
      vast().should.be.ok;
    });
    it('should be an EventEmitter', function() {
      vast().on.should.be.ok;
      vast().removeListener.should.be.ok;
    });
  });
  describe('#parse', function() {
    it('should parse an XML file', function(done) {
      vast('http://127.0.0.1:1337')
        .on('parsed', function(data) { done() })
      ;
    });
  });
  describe('#timeUpdate', function() {
    it('should handle timeUpdate invocations');
  });
});