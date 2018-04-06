(function() {
	'use strict';

  angular
	.module('client.main').controller('client.main.left.controller', clientMainLeftControllerFn);

	clientMainLeftControllerFn.$inject = [
		'rest.service',
		'client.generic.service',
		'$scope',
		'$rootScope',
		'Notification',
	];

	function clientMainLeftControllerFn(restService, clientGenericService, $scope, $rootScope, Notification) {
		var vm = this;

		console.log('hej');
		function markItem(id) {

			var foundItemIdx = _.findIndex(vm.currentSeating.items, { 'id' : id });

			if (foundItemIdx == -1) {
				foundItemIdx = 9999;
			}

			vm.currentSeating.items = _.map(vm.currentSeating.items, function(item, idx) {
console.log(item, idx);
				item.hasPassed = idx < foundItemIdx;
				return item;
			});
		}

		$scope.$on('client.generic:setSeating', function(ev, seating) {
			var currentCase;
			clientGenericService.fullSeating(seating).then(function(data) {
				vm.currentSeating = data;
				if (!data.current_item) {
					currentCase = _.first(data.items).case;
				} else {
					currentCase = _.first(_.filter(data.items, { 'id' : data.current_item })).case;
				}

				console.log('here');

				markItem(vm.currentSeating.current_item);
				$rootScope.$broadcast('case_updated', currentCase.id);
			});
		});

		$scope.$on('ws:current_item_changed', function(ev, data) {
			vm.currentSeating.current_item = data.event;
			markItem(vm.currentSeating.current_item);
			var thisItem = _.find(vm.currentSeating.items, { 'id' : data.event });
			$rootScope.$broadcast('case_updated', thisItem.case.id);
			$scope.$apply();
			Notification.success('Nytt ärende: ' + thisItem.case.title);
		});

		vm.changeCase = function(caseId) {
			$rootScope.$broadcast('case_updated', caseId);
		};

	}


}
)();
