
angular
	.module('view')
	.config(configFn);

configFn.$inject = [
	'$logProvider',
	'$compileProvider',
	'cfpLoadingBarProvider',
];

function configFn($logProvider, $compileProvider, cfpLoadingBarProvider) {
	$logProvider.debugEnabled(true); /* TODO: TURN OFF before production */
	$compileProvider.debugInfoEnabled(true);
	cfpLoadingBarProvider.includeBar = true;
	cfpLoadingBarProvider.includeSpinner = false;
}