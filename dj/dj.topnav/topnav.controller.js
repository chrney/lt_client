(function() {
	'use strict';

  angular
	.module('dj.topnav').controller('dj.topnav.controller', djTopNavControllerFn);

	djTopNavControllerFn.$inject = [
		'$scope',
		'ws.service',
		'dj.generic.service',
	];

	function djTopNavControllerFn($scope, wsService, djGenericService) {
		var vm = this;

		$scope.$on('ws:djAuthenticated', function(ev, data) { /* after authentication */
			vm.user = wsService.user;
			$scope.$digest();
		});


		$scope.$on('dj.generic:setSeating', function(ev, data) {
			vm.currentSeating = data;
			vm.isActive = djGenericService.seatingActive();
		});

		/*
		$scope.$on('ws:changed_case', function(ev, data) {
			vm.currentCase = data;
		});

		$scope.$on('case_updated', function(ev, data) {
			vm.currentCase = data;
			console.log(data);
		});
		*/

	}


})();
