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
            options: {
                banner: '<%= meta.banner %>'
            }
		    , files: {
			    'dist/iife/backbone.siren.min.js': ['dist/iife/backbone.siren.js']
			    , 'dist/amd/backbone.siren.min.js': ['dist/amd/backbone.siren.js']
		    }
	    }


        , rig: {
            compile: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                files: {
                    'dist/iife/backbone.siren.js': ['build/_iife.js']
	                , 'dist/amd/backbone.siren.js': ['build/_amd.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-rigger');

    grunt.registerTask('test', ['jshint', 'buster']);
    grunt.registerTask('build', ['rig', 'uglify']);
};