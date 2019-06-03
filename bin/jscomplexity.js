#!/usr/bin/env node

"use strict";

var _ = require('lodash');
var complexity = require('../lib/index').default;
var fs = require('fs');
var parser = require('nomnom');
var path = require('path');
var yatf = require('yatf');

var rows = [];

function displayMetrics(file, output) {
  var prefix = '';
  var code = fs.readFileSync(file, 'utf-8');

  code = code.replace(/^#!.*\n/, '');

  var metrics = complexity(code);

  function walk(data, name) {

    if (name.indexOf('anon@') === 0) {
      name = name.grey;
    }

    rows.push([ prefix + name, data.ecc, data.arity, data.codeLines ]);

    prefix += '  ';
    _.each(data.children, walk);
    prefix = prefix.slice(0, prefix.length - 2);
  }
  walk(metrics, path.basename(file).blue.bold);

  function writeFile(metrics) {
    var prefix = '';
    var outputRows = [];

    function walk(data, name) {
      outputRows.push(prefix + name + ' ' + data.ecc + ' ' + data.arity + ' ' + data.codeLines);
      prefix += '  ';
      _.each(data.children, walk);
      prefix = prefix.slice(0, prefix.length - 2);
    }

    walk(metrics, file);
    fs.writeFileSync(path.resolve(process.cwd(), output), outputRows.join('\n'));
  }

  if (output) {
    writeFile(metrics);
  }
}



parser.option('file', {
  position: 0,
  required: true,
  help: 'The Javascript file to be measured'
}).option('out', {
  abbr: 'o',
  required: false,
  default: '',
  help: 'write output to file'
});

var opts = parser.parse();

var file = opts.file;
var output = opts.out;

displayMetrics(file, output)

yatf(['Scope', 'CC', 'Ar', 'Cd'], rows, { underlineHeaders: true });
