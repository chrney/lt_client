(function() {
	'use strict';

  angular
	.module('dj.helper').controller('helper.controller', helperControllerFn);

	helperControllerFn.$inject = [
		'helper.service', '$scope',
	];

	function helperControllerFn(helperService, $scope) {
		var vm = this;

		vm.sidebarVisible = helperService.sidebarVisible;
		vm.mainCol = helperService.mainCol;

		$scope.$on('sidebar', function(ev) {
			vm.sidebarVisible = helperService.sidebarVisible;
			vm.mainCol = helperService.mainCol;
		});

		return vm;
	}

}
)();
