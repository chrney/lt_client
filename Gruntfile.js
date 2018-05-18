module.exports = function(grunt) {

		var fileList = [
			'generic/generic.module.js' ,
			'generic/generic.constants.js' ,
			'generic/generic.config.js' ,
			'generic/generic.filter.js' ,
			'generic/ws/ws.module.js' ,
			'generic/ws/ws.service.js' ,

			'view/view.module.js' ,
			'view/view.client.controller.js',
			'view/view.tv.controller.js',
			'view/view.speaker.controller.js',
			'view/view.run.js' ,
			'view/view.service.js' ,
			'view/topnav.controller.js' ,
		];

	grunt.initConfig({

		watch: {
			files: fileList,
		},

		concat: {
			options: {
				separator: '\n\n\n',
			},
			dist: {
				src: fileList,
				dest: 'built.js',
			},
		},


	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('default', ['concat']);


};