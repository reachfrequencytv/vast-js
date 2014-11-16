var should = require('should')
  , path = require('path')
  , fs = require('fs')
  , http = require('http')
  , parser = require(path.join(process.cwd(), 'lib', 'vast-xml-parser'))
;

describe('VastXmlParser', function() {
  describe('#transform', function() {
    describe('- basic properties', function() {
      var data;
      before(function(done) {
        var xml = path.join(process.cwd(), 'test', 'files', 'dfa.xml');
        fs.createReadStream(xml)
          .pipe(parser())
          .on('data', function(chunk) { data = chunk })
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
      it('should add the attributes for ads', function() {
        data.ads[0].id.should.eql(223626102);
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
            vastAdTagUri.should.eql('http://localhost:3001');
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
            data.ads[0].id.should.eql(223626102);
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