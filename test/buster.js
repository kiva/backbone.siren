var buster = require('buster');
var config = module.exports;

buster.spec.expose();

config['development'] = {
    env: 'browser'
    , rootPath: '../'
    , deps: [
        'components/jquery/jquery.js'
        , 'components/underscore/underscore.js'
        , 'components/backbone/backbone.js'
    ]
    , sources: ['src/backbone.siren.js']
    , specs: ['test/spec/**/*.js']
};


//@todo add back when grunt-buster supports test groups
//config['build'] = {
//    env: 'browser'
//    , rootPath: '../'
//    , deps: [
//        'components/jquery/jquery.js'
//        , 'components/underscore/underscore.js'
//        , 'components/backbone/backbone.js'
//    ]
//    , sources: ['build/backbone.siren.min.js']
//    , tests: ['test/spec/**/*.js']
//};