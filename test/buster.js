'use strict';

var config = module.exports;

config.development = {
    env: 'browser'
    , rootPath: '../'
    , deps: [
		'test/assertions.js'
        , 'bower_components/jquery/jquery.js'
        , 'bower_components/underscore/underscore.js'
        , 'bower_components/backbone/backbone.js'
        , 'src/patternLibrary.js'
    ]
    , sources: ['src/backbone.siren.js', 'src/backbone.siren.action.js', 'src/backbone.siren.store.js', 'src/backbone.siren.formView.js', 'src/backbone.siren.validate.js']
    , specs: ['test/spec/**/*.js']
    , extensions: [ require('buster-coverage') ]
    , 'buster-coverage': {
        outputDirectory: 'test/coverage'
        , format: 'lcov'
        , combinedResultsOnly: true
    }
};


// @todo - enable these

config.dist_amd = {
    env: 'browser'
    , rootPath: '../'
    , deps: [
		'test/assertions.js'
        , 'bower_components/jquery/jquery.js'
        , 'bower_components/underscore/underscore.js'
        , 'bower_components/backbone/backbone.js'
    ]
    , sources: ['dist/amd/backbone.siren.min.js']
    , tests: ['test/spec/**/*.js']
};


config.dist_iife = {
	env: 'browser'
	, rootPath: '../'
	, deps: [
		'test/assertions.js'
		, 'bower_components/jquery/jquery.js'
		, 'bower_components/underscore/underscore.js'
		, 'bower_components/backbone/backbone.js'
	]
	, sources: ['dist/iife/backbone.siren.min.js']
	, tests: ['test/spec/**/*.js']
};
