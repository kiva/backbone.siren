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

        , dox: {
            files: {
                src: ['src/**/*.js']
                , dest: 'docs'
            }
        }
    });

    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-dox');
};