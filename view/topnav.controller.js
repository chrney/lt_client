(function() {
	'use strict';

  angular
	.module('view').controller('view.topnav.controller', viewTopNavControllerFn);

	viewTopNavControllerFn.$inject = [
		'$scope',
		'view.service',
		'$interval',
	];

	function viewTopNavControllerFn($scope, viewService, $interval) {
		var vm = this;

		$scope.$on('viewService:clientAuthenticated', function(ev, data) {
			vm.user = viewService.user;
		});

		vm.showCompanyName = true;

		$scope.$on('viewService:lockScreen', function(ev, id) {
			vm.showCompanyName = true;
		});

		$scope.$on('viewService:setSeating', function(ev, data) {
			vm.currentSeating = data;
			vm.isActive = viewService.seatingActive();
			vm.showCompanyName = false;
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
