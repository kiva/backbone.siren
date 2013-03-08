'use strict';


module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')


        , meta: {
            version: '<%= pkg.version %>'
            , banner:
                '/*\n' +
                '* Backbone.Siren v<%= meta.version %>\n' +
                '*\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> Kiva Microfunds\n' +
                '* Licensed under the MIT license.\n' +
                '* https://github.com/kiva/backbone.siren/blob/master/license.txt\n' +
                '*/\n'
        }


        , buster: {
            test: {
                reporter: 'specification'
            }
        }


        , jshint: {
            options: {
                jshintrc: '.jshintrc'
            }
            , all: ['src/*.js', 'test/spec/**/*.js']
        }


        , uglify: {
            target: {
                options: {
                    banner: '<%= meta.banner %>'
                }
                , files: {
                    'build/backbone.siren.min.js': ['build/backbone.siren.js']
                    , 'build/amd/backbone.siren.min.js': ['build/amd/backbone.siren.js']
                }
            }
        }


        , rig: {
            options: {
                banner: '<%= meta.banner %>'
            }
            , files: {
                compile: {
                    'build/backbone.siren.js': ['src/build/_core.js']
                    , 'build/amd/backbone.siren.js': ['src/build/_amd.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-rigger');

    grunt.registerTask('test', ['jshint', 'buster']);
    grunt.registerTask('build', ['jshint', 'buster', 'rig']);
};