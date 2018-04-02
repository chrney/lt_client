(function() {
	'use strict';

  angular
	.module('client.topnav').controller('client.topnav.controller', clientTopNavControllerFn);

	clientTopNavControllerFn.$inject = [
		'$scope',
		'ws.service',
		'client.generic.service',
	];

	function clientTopNavControllerFn($scope, wsService, clientGenericService) {
		var vm = this;

		$scope.$on('ws:clientAuthenticated', function(ev, data) { /* after authentication */
			vm.user = wsService.user;
			$scope.$digest();
		});

		$scope.$on('client.generic:setSeating', function(ev, data) {
			vm.currentSeating = data;
			vm.isActive = clientGenericService.seatingActive();
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
