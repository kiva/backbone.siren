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
		    dev: {
			    test: {
				    'config-group': 'development'
				    , reporter: 'specification'
			    }
		    }
		    , dist_amd: {
			    test: {
				    'config-group': 'dist_amd'
				    , reporter: 'specification'
			    }
		    }
		    , dist_iife: {
			    test: {
				    'config-group': 'dist_iife'
				    , reporter: 'specification'
			    }
		    }
        }

        
        , coveralls: {
            options: {
                force: true
            }
            , coverage: {
                src: 'test/coverage/lcov.info'
            }
        }


        , jshint: {
            options: {
                jshintrc: '.jshintrc'
            }
            , all: ['src/*.js', 'test/spec/**/*.js']
        }


        , uglify: {
		    minify: {
			    options: {
				    banner: '<%= meta.banner %>'
			    }
			    , files: {
				    'dist/iife/backbone.siren.min.js': ['dist/iife/backbone.siren.js']
				    , 'dist/amd/backbone.siren.min.js': ['dist/amd/backbone.siren.js']
			    }
		    }
	    }


        , release: {
            options: {
                additionalFiles: ['bower.json']
                , tagName: 'v<%= version %>'
                , npm: false
                , afterBump: [
                    'build'
                ]
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
    grunt.loadNpmTasks('grunt-coveralls');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-rigger');

    grunt.registerTask('test', ['jshint', 'buster:dev']);
    grunt.registerTask('build', ['rig', 'uglify']);
};