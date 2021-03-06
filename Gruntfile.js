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
  				'assets/compiled/styles/styles.css': 'assets/styles/styles.scss'
  			}
  		}
    },
    watch: {
      scripts: {
        files: '**/*.scss',
        tasks: ['sass']
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');

  // Default task(s).
  grunt.registerTask('default', ['sass']);
};
