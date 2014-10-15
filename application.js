#!/usr/bin/env node

var _ = require("lodash");
var nconf = require("nconf");
var Tckr = require([__dirname, "tckr"].join("/"));

// instantiate and initialize Tckr
var tckr = new Tckr();
tckr.initialize();
