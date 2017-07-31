module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
  		options: {
  			sourceMap: true
  		},
  		dist: {
  			files: {
  				'src/css/styles.css': 'src/css/styles.scss'
  			}
  		}
	   }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-sass');

  // Default task(s).
  grunt.registerTask('default', ['sass']);

};
