(function() {
	'use strict';

  angular
	.module('client.main').controller('client.main.center.controller', clientMainCenterControllerFn);

	clientMainCenterControllerFn.$inject = [
		'rest.service',
		'$scope',
		'client.generic.service',
		'Notification',
		'$rootScope',
	];

	function clientMainCenterControllerFn(restService, $scope, clientGenericService, Notification, $rootScope) {
		var vm = this;

		vm.testBtn = function() {
			$rootScope.$broadcast('mode_changed', {
				'mode' : 'vote',
				'data' : {
					'id' : 250,
					'seating' : 143
				}
			});
		};

		vm.testBtn2 = function() {
			$rootScope.$broadcast('mode_changed', {
				'mode' : 'attendance',
				'data': {
					'attendance': 1
				}
			});
		};

		$scope.$on('case_updated', function(ev, caseId) {
			clientGenericService.fullCase(caseId).then(function(data) {
				vm.case = data;
				clientGenericService.viewingCase = caseId;
			});
		});

		$rootScope.$on('mode_changed', function(ev, response) {
			vm.narrowCol = (response.mode != '' && !clientGenericService.isMinister());
		});

	}

}
)();
