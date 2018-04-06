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

		$scope.$watch('vm.mustCheckin', function(newVal, oldVal) {
			if (newVal == true) {
				vm.openAttendance();
			}
		});

		$scope.$on('client.generic:setSeating', function(ev, seating) {
			var currentCase;
			clientGenericService.fullSeating(seating).then(function(data) {
				vm.currentSeating = data;
				//if (!data.current_item) {
				//	currentCase = _.first(data.items).case;
				//} else {
				//	currentCase = _.find(data.items, { 'id' : data.current_item }).case;
				//}

				var findFirstInSeparareList = _.findIndex(vm.currentSeating.items, { 'separate_list' : '1' });
				if (findFirstInSeparareList > -1) {
					vm.currentSeating.items[findFirstInSeparareList].showSeparateHeader = true;
				}

				vm.currentSeating.items = _.map(vm.currentSeating.items, function(item, idx) {
					item.idx = idx + 1;
					return item;
				});
				//$rootScope.$broadcast('case_updated', currentCase.id);


				if (vm.currentSeating.state == '4' && vm.isLedamot) { // active
					var check = _.find(vm.currentSeating.attendants, { 'person' : loginService.currentUser.member.id });
					vm.mustCheckin = check.type != '163'; // dvs inte närvarande (än)
				} else {
					vm.mustCheckin = false;
				}

				setTimeout(function() {
					scrollToItem(vm.currentSeating.current_item);
				}, 500);

			});
		});

		vm.openDocument = function (obj) {
			obj.sanitizedPath = $sce.trustAsResourceUrl("https://view.lagtinget.ax/proxy.php?file=" + obj.path);
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

		vm.openAttendance = function () {
			$ocModal.open({
				url: '/client/client.main/attendance.tpl.html',
				cls: 'fade-in',
				init: {
					vm : vm,
				},

				onOpen: function() { }
			});
		}

		vm.sendAttendance = function() {
			restService.post('seatings/' + clientGenericService.currentSeating.id + '/register', {
				'person' : loginService.currentUser.member.id,
				'state' : '163'
			}, {
				'X-CSRF-Token' : loginService.getToken(),
			}).then(function(r) {

				$rootScope.$broadcast('mode_changed', {
					'mode' : '',
				});
				$ocModal.close();
			});

		}

		function scrollToItem(id) {

			if (id) {


				var foundItem = document.getElementById("item-" + id);
				if (_.has(foundItem, 'offsetTop')) {
					document.getElementById('sidebar-wrapper').scrollTop = foundItem.offsetTop;
				}

				var foundItemIdx = _.findIndex(vm.currentSeating.items, { 'id' : id });

				if (foundItemIdx == -1) {
					foundItemIdx = 9999;
				}

				vm.currentSeating.items = _.map(vm.currentSeating.items, function(item, idx) {
					item.hasPassed = idx < foundItemIdx;
					return item;
				});
			}

		}

		$scope.$on('ws:current_item_changed', function(ev, data) {
			vm.currentSeating.current_item = data.current_item;
			var thisItem = _.find(vm.currentSeating.items, { 'id' : data.current_item });
			$rootScope.$broadcast('case_updated', thisItem.case.id);

			if (thisItem) {
				console.log(vm.currentSeting.items, data.current_item);
				scrollToItem(thisItem.id);
			}

			//document.getElementById('sidebar-wrapper').scrollTop = document.getElementById("item-" + thisItem.id).offsetTop;

			$scope.$apply();
			//Notification.success('Nytt ärende: ' + thisItem.case.title);
		});

		$rootScope.$on('ws:clientAuthenticated', function(ev, response) {
			vm.user = response;

			var roles = _.values(vm.user.roles);
			_.each(['ledamot', 'minister', 'talman'], function(str) {
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

				restService.get('votings').one(response.data.id).get().then(function (votingResponse) {
					response.data = votingResponse.plain();

					var foundVote = _.find(response.data.votes, {'person': vm.user.person.id})

					if (_.has(foundVote, 'vote')) {
						response.data.myVote = foundVote.vote;
					}

					response.data.buttons = [
						_.find(appConstants.VOTE_STATES, {'id': '1'}),
						_.find(appConstants.VOTE_STATES, {'id': '2'}),
						_.find(appConstants.VOTE_STATES, {'id': '0'})
					];

					vm.currentVoting = response.data;
					vm.openVoting(vm.currentVoting);
				});
			}

			if (vm.mode == 'attendance' && (vm.isLedamot || vm.isTalman)) {
				vm.attendance = response.data;
				restService.get('seatings').one(response.data.seating).get().then(function (seatingResponse) {
					seatingResponse = seatingResponse.plain();
					var thisCheck = _.find(seatingResponse.attendants, {'person': vm.user.person.id});
					if (thisCheck.type == '163') {
						console.log('Already checked in');
						clientGenericService.setMode('', {});
						vm.mustCheckin = false;
					} else {
						console.log('opening attendance');
						vm.mustCheckin = true;
					}
				});
			}

			if (vm.mode == '') {

				// make sure there's no voting open.
				console.log('Checking ongoing votings');
				restService.get('votings/?open=1').getList().then(function(openVotings) {

					openVotings = openVotings.plain();

					if (openVotings.length > 0) {
						console.log('Voting ongoing, changing mode');

						clientGenericService.setMode('vote', openVotings[0]);
					}
				});


			}

		});


		}

}
)();
