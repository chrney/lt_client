(function() {
	'use strict';

  angular
	.module('client.main').controller('client.main.controller', clientMainControllerFn);

	clientMainControllerFn.$inject = [
		'rest.service',
		'$scope',
		'client.generic.service',
		'Notification',
		'$rootScope',
		'$ocModal',
		'$sce',
		'appConstants',
		'login.service',
	];

	function clientMainControllerFn(restService, $scope, clientGenericService, Notification, $rootScope, $ocModal, $sce, appConstants, loginService) {

		var vm = this;

		$scope.$on('client.generic:setSeating', function(ev, seating) {
			var currentCase;
			clientGenericService.fullSeating(seating).then(function(data) {
				vm.currentSeating = data;
				if (!data.current_item) {
					currentCase = _.first(data.items).case;
				} else {
					currentCase = _.find(data.items, { 'id' : data.current_item }).case;
				}

				vm.currentSeating.items = _.map(vm.currentSeating.items, function(item, idx) {
					item.idx = idx + 1;
					return item;
				});
				$rootScope.$broadcast('case_updated', currentCase.id);
			});
		});


		vm.openDocument = function (obj) {
			obj.sanitizedPath = $sce.trustAsResourceUrl(obj.path);
			$ocModal.open({
				url: '/client/client.main/document.tpl.html',
				cls: 'fade-in',
				init: {
					doc: obj
				},

				onOpen: function() { }
			});
		}


		vm.openVoting = function (obj) {
			$ocModal.open({
				url: '/client/client.main/voting.tpl.html',
				cls: 'fade-in',
				init: {
					voting: obj,
					vm : vm,
				},

				onOpen: function() { }
			});
		}

		$scope.$on('ws:current_item_changed', function(ev, data) {
			vm.currentSeating.current_item = data.current_item;
			var thisItem = _.find(vm.currentSeating.items, { 'id' : data.current_item });
			$rootScope.$broadcast('case_updated', thisItem.case.id);

			document.getElementById('sidebar').scrollTop = document.getElementById("item-" + thisItem.id).offsetTop;

			$scope.$apply();
			//Notification.success('Nytt ärende: ' + thisItem.case.title);
		});

		$rootScope.$on('ws:clientAuthenticated', function(ev, response) {
			vm.user = response;

			var roles = _.values(vm.user.roles);
			_.each(['ledamot', 'minister', 'talman'], function(str) {
				console.log(str, 'is' + _.startCase(_.toLower(str)));
				vm['is' + _.startCase(_.toLower(str))] = _.includes(roles, str);
			});
			$scope.$apply();
		});

		vm.sendVote = function(vote) {

			restService.post('votings/' + vm.currentVoting.id + '/vote', {
				'person' : loginService.currentUser.member.id,
				'vote' : vote.id
			}, {
				'X-CSRF-Token' : loginService.getToken(),
			}).then(function(response) {
				if (vote == 1) {
					Notification.success('Du röstade <strong>Ja</strong>');
				} else if(vote == 2) {
					Notification.error('Du röstade <strong>Nej</strong>');
				} else if(vote == 0) {
					Notification.warning('Du avstod från att rösta.');
				}

//				vm.currentVoting.myVote = response;
//				console.log('..', response);
			});
		};


		$rootScope.$on('ws:user_vote_added', function(ev, response) {
			vm.currentVoting.myVote = response;
			$scope.$apply();
		});




		$rootScope.$on('mode_changed', function(ev, response) {

			if (response.mode == '' && vm.mode == 'vote') { /* closed voting: hide vote-modal */
				$ocModal.close();
			}

			vm.mode = response.mode;

			if (vm.mode == 'vote' && vm.isLedamot) {

				response.data.myVote = _.find(response.data.votes, { 'person' : vm.user.person.id }).vote;
console.log(response.data.myVote);
				response.data.buttons = [
					_.find(appConstants.VOTE_STATES, { 'id' : '1'}),
					_.find(appConstants.VOTE_STATES, { 'id' : '2'}),
					_.find(appConstants.VOTE_STATES, { 'id' : '0'})
				];

				vm.currentVoting = response.data;
				vm.openVoting(vm.currentVoting);
			}

			if (vm.mode == 'attendance' && vm.isLedamot) {
				vm.attendance = response.data;
			}

		});


		}

}
)();
