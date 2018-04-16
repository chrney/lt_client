(function() {
	'use strict';

	angular
		.module('view')
			.run(runBlockFn);

	runBlockFn.$inject = [
		'view.service',
		'$rootScope',
	];


	function runBlockFn(viewService, $rootScope) {

		$rootScope.$onMany = function(events, fn) {
			for(var i = 0; i < events.length; i++) {
				this.$on(events[i], fn);
			}
		};

		viewService.init();

	}



})();
