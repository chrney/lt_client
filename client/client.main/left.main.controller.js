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

		function markItem(id) {
			var r2 = _.findIndex(vm.currentSeating.items, function(item) {
				return item.id == id;
			});

			return _.map(vm.currentSeating.items, function(item, idx) {
				item.visible = idx >= (r2 - 1);
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

				vm.currentSeating.items = markItem(vm.currentSeating.current_item);
				$rootScope.$broadcast('case_updated', currentCase.id);
			});
		});

		$scope.$on('ws:current_item_changed', function(ev, data) {
			vm.currentSeating.current_item = data.event;
			vm.currentSeating.items = markItem(vm.currentSeating.current_item);
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
