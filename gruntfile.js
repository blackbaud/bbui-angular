/// <vs BeforeBuild='default' SolutionOpened='watch' />
/*jslint nomen: true */
/*global module, require */

module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        buildPath: grunt.option('buildpath') || 'dist',
        bump: {
            options: {
                files: ['bower.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['-a'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                regExp: false
            }
        },
        // We used to use grunt-contrib-concat here but the source maps never came out right.  This one works much better.
        concat_sourcemap: {
            options: {
                sourcesContent: true,
                sourceRoot: '../..'
            },
            dist: {
                files: {
                    '<%= buildPath %>/js/bbui.js': [
                        'src/*.js'
                    ]
                }
            }
        },
        watch: {
            sass: {
                files: ['src/scss/*.scss'],
                tasks: ['sass']
            },
            scripts: {
                files: ['src/*.js'],
                tasks: ['concat_sourcemap:dist']
            }
        },
        jsduck: {
            main: {
                src: [
                    "src"
                ],
                dest: "docs",
                options: {

                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concat-sourcemap');
    grunt.loadNpmTasks('grunt-jsduck');

    grunt.registerTask('default', ['concat_sourcemap']);
    grunt.registerTask('build', ['default']);
    grunt.registerTask('docs', ['jsduck']);

};