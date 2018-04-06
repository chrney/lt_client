(function() {
	'use strict';

	angular
		.module('view')
			.run(runBlockFn);

	runBlockFn.$inject = [
		'view.service',
	];

	function runBlockFn(viewService) {

		viewService.init();

	}



})();
