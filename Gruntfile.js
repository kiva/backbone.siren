'use strict';


module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            }
            , all: ['src/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint', 'buster']);
};