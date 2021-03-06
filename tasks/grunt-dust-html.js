/*
 * Grunt Dust-HTML
 * https://github.com/ehynds/grunt-dust-html
 *
 * Copyright (c) 2014 Eric Hynds
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  "use strict";

  var dusthtml = require('./lib/dusthtml');
  var Promise = require('bluebird');

  grunt.registerMultiTask('dusthtml', 'Render Dust templates against a context to produce HTML', function() {
    var done = this.async();
    var opts = this.options();
    var dfds = [];

    dusthtml.init(opts);

    this.files.forEach(function(file) {
      file.src.forEach(function(filepath) {
        var input = grunt.file.read(filepath);

        dfds.push(new Promise(function(resolve, reject) {
          dusthtml.render(input, filepath, function(err, html) {
            if(err) {
              return reject(err);
            }

            grunt.file.write(file.dest, html);
            grunt.log.ok('File "' + file.dest + '" created.');
            resolve();
          });
        })
        );
      });
    });
    Promise.all(dfds).then(function() {
      console.log('all templates are done');
      done();
    }).catch(grunt.fail.fatal);
  });

};
