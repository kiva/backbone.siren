var config = module.exports;

config['development'] = {
    env: 'browser'
    , rootPath: '../'
    , deps: [
        'bower_components/jquery/jquery.js'
        , 'bower_components/underscore/underscore.js'
        , 'bower_components/backbone/backbone.js'
        , 'src/patternLibrary.js'
    ]
    , sources: ['src/backbone.siren.js', 'src/backbone.siren.formView.js', 'src/backbone.siren.validate.js']
    , specs: ['test/spec/**/*.js']
    , extensions: [ require('buster-coverage') ]
    , "buster-coverage": {
        outputDirectory: "test/coverage"
        , format: "lcov"
        , combinedResultsOnly: true
    }
};


//@todo add back when grunt-buster supports test groups
//config['build'] = {
//    env: 'browser'
//    , rootPath: '../'
//    , deps: [
//        'bower_components/jquery/jquery.js'
//        , 'bower_components/underscore/underscore.js'
//        , 'bower_components/backbone/backbone.js'
//    ]
//    , sources: ['build/backbone.siren.min.js']
//    , tests: ['test/spec/**/*.js']
//};