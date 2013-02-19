var buster = require('buster');
var config = module.exports;

buster.spec.expose();

config['Browser Tests'] = {
    env: 'browser'
    , rootPath: '../'
    , deps: [
        'components/jquery/jquery.js'
        , 'components/underscore/underscore.js'
        , 'components/backbone/backbone.js'
    ]
    , sources: ['src/backbone.siren.js']
    , tests: ['test/spec/**/*.js']
};