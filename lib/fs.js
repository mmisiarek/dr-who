'use strict';
const fs = require('fs');

/**
 * Purpose of this module is to promisify some of the methods from fs module.
 */

module.exports.readFile = function(path){
  return new Promise( (resolve, reject) => {
    fs.readFile(path, function(err, file) {
      if (err) { return reject (err); }
      resolve(file);
    });
  });
};

/**
 * Pass original module so it is still possible to use rest
 * of its methods
 */
module.exports.native = fs;
