(function() {
	'use strict';

  angular
	.module('client.topnav').controller('client.topnav.controller', clientTopNavControllerFn);

	clientTopNavControllerFn.$inject = [
		'$scope',
		'ws.service',
		'client.generic.service',
		'$interval',
	];

	function clientTopNavControllerFn($scope, wsService, clientGenericService, $interval) {
		var vm = this;

		$scope.$on('ws:clientAuthenticated', function(ev, data) { /* after authentication */
			vm.user = wsService.user;
			$scope.$digest();
		});

		$scope.$on('client.generic:setSeating', function(ev, data) {
			vm.currentSeating = data;
			vm.isActive = clientGenericService.seatingActive();
		});




		function tick() {
			var rightNow = new Date(),
				hoursRightNow = rightNow.getHours();
			vm.clock = rightNow;
			vm.showDots = !vm.showDots;
			vm.showBlank = (hoursRightNow < 7 || hoursRightNow > 22);
		}

		tick();
		$interval(tick, 1000);





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
