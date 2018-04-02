(function() {
	'use strict';

	angular
		.module('generic')
			.config(configFn);

	configFn.$inject = [
		'$logProvider',
		'$compileProvider',
		'cfpLoadingBarProvider',
	];

	function configFn($logProvider, $compileProvider, cfpLoadingBarProvider) {
		$logProvider.debugEnabled(true); /* TODO: TURN OFF before production */
		$compileProvider.debugInfoEnabled(false);
		cfpLoadingBarProvider.includeBar = true;

	}

})();
