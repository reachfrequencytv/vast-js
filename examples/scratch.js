vast('http://adserver.com/vast.xml')
  .on('parsed', function(data) {
    assert(Array.isArray(data.ads));
  })
;