'use strict';

var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var async = require('async');
var grunt = require('grunt');
var opts,dust,context;

module.exports.init = function(options) {
  opts = _.extend({
      partialsDir: '.',
      defaultExt: '.dust',
      whitespace: false,
      helpers: [],
      vars: {},
      onInit: function(){},
      module: 'dustjs-linkedin', // dust, dustjs-helpers, or dustjs-linkedin
      context: {},
      htmlDirName: 'html',
      dataDirName: 'data'
    }, options || {});

  dust = require(opts.module);
  context = opts.context;

  //load additional helpers
  _.each(opts.helpers,function(helper) {
    require(helper);
  });

  opts.onInit(dust,opts);

}


module.exports.render = function(input, filename, callback) {

  var tmpl;

  // Configure dust to load partials from the paths defined
  // in the `partialsDir` option
  dust.onLoad = function(filePath, loadCallback) {
    // Make sure the file to load has the proper extension
    if(!path.extname(filePath).length) {
      filePath += opts.defaultExt;
    }

    // If we're dealing with relative paths..
    if(filePath.charAt(0) !== '/') {
      // Only joins the paths if "string"
      if(typeof opts.partialsDir === 'string') {
        filePath = path.join(opts.partialsDir, filePath);

      // Checks whether the "partialsDir" option is an Array and returns the first folder that contains the file.
      } else if(Array.isArray(opts.partialsDir)) {
        for(var i = 0; i < opts.partialsDir.length; i++) {
          if(grunt.file.isFile(path.join(opts.partialsDir[i], filePath))) {
            filePath = path.join(opts.partialsDir[i], filePath);
            break;
          }
        }
      }
    }

    fs.readFile(filePath, 'utf8', function(err, html) {
      if(err) {
        return callback(new Error('Cannot find partial ' + filePath));
      }

      loadCallback(null, html);
    });
  };

  // Preserve whitespace?
  if(opts.whitespace) {
    dust.optimizers.format = function(ctx, node) {
      return node;
    };
  }

  // Pre-compile the template
  try {
    tmpl = dust.compileFn(input);
  } catch(err) {
    callback(err);
  }

  // If the context option is a string, assume it's a file and read it as JSON
  if(typeof opts.context === 'string') {
    context = grunt.file.readJSON(opts.context);

  // If context is an array merge each item together
  } else if(Array.isArray(opts.context)) {
    opts.context.forEach(function(obj) {
      if(typeof obj === 'string') {
        obj = grunt.file.readJSON(obj);
      }

      _.extend(context, obj);
    });
  }

  //inject vars coming from grunt task
  _.extend(context, opts.vars);

  var viewjsonsrc = path.dirname(filename).replace(opts.htmlDirName, opts.dataDirName) + '/' + path.basename(filename).replace(opts.defaultExt,'') + '.json',
      viewjson = fs.readJsonSync(viewjsonsrc, {throws: false}),
      viewmodel = viewjson || {};
  
  console.log('adding',viewjsonsrc);
  _.extend(context, viewmodel);

  // Render the template and pass the result directly to the callback
  tmpl(context, callback);
};
