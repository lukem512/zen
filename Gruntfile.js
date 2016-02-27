var path = require('path');
var load = require('load-grunt-tasks');

// Define the gruntiness
module.exports = function(grunt) {

  // Configuration
  grunt.initConfig({
    jshint: {
      all: [ 'Gruntfile.js', 'public/javascripts/**/*.js' ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    bower: {
      options: {
        layout: 'byType',
        install: true,
        verbose: false,
        cleanTargetDir: false,
        targetDir: 'public/vendor'
      },
      install: {
         // Nothing to do here
      }
    }
  });

  // Load all modules
  load(grunt);

  // Register all tasks
  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('build', ['bower:install']);
  grunt.registerTask('default', ['build']);

};
