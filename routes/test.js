var fs = require('fs');

module.exports = {
  parseFile: function(file_path, callback) {
    fs.readFile(file_path.toString(), 'utf-8', function(err, data) {
      if (err) return callback(err);
      callback(null, data);
    });
  }
}

// much shorter version
exports.parseFile = function(file_path, callback) {
  fs.readFile(file_path.toString(), 'utf-8', callback);
}
