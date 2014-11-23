var http = require('http')
  , fs = require('fs')
  , path = require('path')
  , browserify = require('browserify')
  , PORT = 3000
;

http.createServer(function(req, res) {
  var filePath;
  res.setHeader('access-control-allow-origin', '*');
  if (req.url == '/vast.js') {
    var b = browserify({ standalone: 'vast' });
    b.add(path.join(process.cwd(), 'index.js'));
    return b.bundle().pipe(res);
  } else if (req.url == '/dfa.xml')
    filePath = path.join(process.cwd(), 'test', 'files', 'dfa.xml');
  else
    filePath = path.join(process.cwd(), 'test', 'public', 'index.html');
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT);
console.log('vast.js test server listening on %s', PORT)