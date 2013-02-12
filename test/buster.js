var buster = require('buster');
var config = module.exports;

buster.spec.expose();

config['Browser Tests'] = {
    env: 'browser'
    , rootPath: '../'
    , sources: ['src/Backbone.Siren.js']
    , tests: ['test/spec/**/*.js']
};