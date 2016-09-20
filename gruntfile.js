/// <vs BeforeBuild='default' SolutionOpened='watch' />
/*jslint nomen: true */
/*global module */

module.exports = function (grunt) {
    'use strict';

    var jsHintFiles = ['*.js', 'src/**/*.js', 'test/**/*.js'];

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
        uglify: {
            options: {
                sourceMap: true
            },
            dist: {
                options: {
                    sourceMapIn: 'dist/js/bbui.js.map'
                },
                src: ['dist/js/bbui.js'],
                dest: 'dist/js/bbui.min.js'
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
                dest: "documentation/docs",
                options: {
                    title: "Blackbaud : bbui-angular",
                    welcome: "documentation/welcome.html",
                    images: "documentation/images",
                    "head-html": "<link rel=\"stylesheet\" href=\"../style/style.css\" type=\"text/css\" />",
                    footer: "Copyright Blackbaud 2016",
                    guides: "documentation/guides/guides.json"
                }
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            all: jsHintFiles
        },
        jscs: {
            options: {
                config: '.jscsrc'
            },
            all: jsHintFiles
        },
        karma: {
            options: {
                configFile: './karma.conf.js'
            },
            unit: {
                singleRun: true
            },
            watch: {
                background: true
            }
        },
        exec: {
            uploadCoverage: {
                cmd: './node_modules/.bin/codecov'
            }
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concat-sourcemap');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsduck');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['concat_sourcemap', 'uglify']);
    grunt.registerTask('build', ['default']);
    grunt.registerTask('docs', ['jsduck']);
    grunt.registerTask('lint', ['jshint', 'jscs']);

    grunt.registerTask('unittest', 'karma:unit');

    // This is the main entry point for testing skyux.
    grunt.registerTask('test', function () {
        var tasks;

        tasks = [
            'lint',
            'build',
            'unittest'
            //'exec:uploadCoverage'
        ];

        grunt.task.run(tasks);
    });
};