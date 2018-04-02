(function() {
	'use strict';

  angular
	.module('dj.main').controller('dj.main.center.controller', djMainCenterControllerFn);

	djMainCenterControllerFn.$inject = [
		'rest.service',
		'$scope',
		'dj.generic.service',
		'Notification',
		'$rootScope',
	];

	function djMainCenterControllerFn(restService, $scope, djGenericService, Notification, $rootScope) {
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
			console.log('center on case_updated trigger');
			//	djGenericService.fullCase(caseId).then(function(data) {
			//	vm.case = data;
			//	djGenericService.viewingCase = caseId;
			//});
		});

		$rootScope.$on('mode_changed', function(ev, response) {
			vm.narrowCol = (response.mode != '');
		});

	}

}
)();
