(function() {
	'use strict';

  angular
	.module('view').controller('view.controller', viewControllerFn);

		viewControllerFn.$inject = [
		'rest.service',
		'$scope',
		'view.service',
		'Notification',
		'$rootScope',
		'$ocModal',
		'$sce',
		'appConstants',
		'login.service',
	];

	function viewControllerFn(restService, $scope, viewService, Notification, $rootScope, $ocModal, $sce, appConstants, loginService) {

		var vm = this;

		$scope.$watch('vm.mustCheckin', function(newVal, oldVal) {
			if (newVal == true) {
			//	vm.openAttendance();
			}
		});

		$scope.$on('viewService:setSeating', function(ev, seating) {
			vm.currentSeating = seating;

			if (viewService.seatingActive() && viewService.user.isLedamot) {
				console.log(viewService.user.person.id, vm.currentSeating);
				var check = _.find(vm.currentSeating.attendants, { 'person' : viewService.user.person.id });
				vm.mustCheckin = check.type != '163'; // dvs inte närvarande (än)
			} else {
				vm.mustCheckin = false;
			}

			setTimeout(function() {
				scrollToItem(viewService.currentSeating.current_item);
			}, 500);
		});


		$scope.$on('viewService:setCase', function(ev, id) {
			if (id) {
				console.log('viewService:setCase trigger', id);
				scrollToItem(id);
			}
		});

		vm.openDocument = function (obj) {
			obj.sanitizedPath = $sce.trustAsResourceUrl("https://view.lagtinget.ax/proxy.php?file=" + obj.path);
			$ocModal.open({
				url: '/view/document.tpl.html',
				cls: 'fade-in',
				init: {
					doc: obj
				},

				onOpen: function() { }
			});
		}

		vm.openVoting = function (obj) {
			setTimeout(function() {
				$ocModal.open({
					url: '/view/voting.tpl.html',
					cls: 'fade-in',
					init: {
						voting: obj,
						vm : vm,
					},

					onOpen: function() { }
				});
			}, 500);
		}

		vm.openAttendance = function () {
			console.error('Modal attendance');
				$ocModal.open({
					url: '/view/attendance.tpl.html',
					cls: 'fade-in',
					init: {
						vm: vm,
					},

					onOpen: function () {
					}
				});
		}

		vm.sendAttendance = function() {
			restService.post('seatings/' + viewService.currentSeating.id + '/register', {
				'person' : loginService.currentUser.member.id,
				'state' : '163'
			}, {
				'X-CSRF-Token' : loginService.getToken(),
			}).then(function(r) {

				viewService.user.mustCheckin = false;
				vm.mustCheckin = false;
				viewService.setMode('');
			});

		}

		function scrollToItem(id) {

			if (id) {
				var foundItem = document.getElementById("item-" + id);
				if (!_.isNull(foundItem)) {
					document.getElementById('sidebar-wrapper').scrollTop = foundItem.offsetTop;
				}
			}
		}

		vm.sendVote = function(vote) {
			restService.post('votings/' + vm.currentVoting.id + '/vote', {
				'person' : loginService.currentUser.member.id,
				'vote' : vote.id
			}, {
				'X-CSRF-Token' : loginService.getToken(),
			});
		};

		$rootScope.$on('ws:user_vote_added', function(ev, response) {
			vm.currentVoting.myVote = response;
			$scope.$apply();
		});

		$rootScope.$on('viewService:mode_changed', function(ev, response) {

			if (!viewService.user.mustCheckin) { /* closed voting: hide vote-modal. Likewise  */
				console.log('Must NOT checkin. closing all');
				$ocModal.close();
			}

			vm.mode = response.mode;

			if (viewService.user.mustCheckin && vm.mode != 'attendance') {
				return;
			}

			console.error('Mode changed to ', response.mode);

			if (vm.mode == 'vote' && viewService.user.isLedamot && !viewService.user.mustCheckin) {
				restService.get('votings').one(response.data.id).get().then(function (votingResponse) {
					response.data = votingResponse.plain();

					var foundVote = _.find(response.data.votes, {'person': viewService.user.person.id})

					if (_.has(foundVote, 'vote')) {
						response.data.myVote = foundVote.vote;
					}

					response.data.buttons = [
						_.find(appConstants.VOTE_STATES, {'id': '1'}),
						_.find(appConstants.VOTE_STATES, {'id': '2'}),
						_.find(appConstants.VOTE_STATES, {'id': '0'})
					];

					console.log('found open voting.');
					vm.currentVoting = response.data;
					vm.openVoting(vm.currentVoting);
				});

				return;
			}

			if (vm.mode == 'attendance' && viewService.user.mustCheckin) {
				console.error('Checking for attendance');
				vm.attendance = response.data;
				var thisCheck = _.find(viewService.currentSeating.attendants, {'person': viewService.user.person.id});
				if (thisCheck.type == '163' || thisCheck.type == '159') { /* already checked in */
					console.error('Checked in before');
					viewService.user.mustCheckin = false;
					viewService.setMode('', {});
				} else {
					console.error('Not checked in before');
					viewService.user.mustCheckin = true;
					vm.openAttendance();
				}
				vm.mustCheckin = viewService.user.mustCheckin;

				return;
			}

			if (vm.mode == '') {
				console.error('Checking for default');
				restService.get('votings/?open=1').getList().then(function(openVotings) {
					openVotings = openVotings.plain();
					console.error('Checking for votings');
					if (openVotings.length > 0) {
						console.error('Set to vote mode');
						viewService.setMode('vote', openVotings[0]);
						return;
					}
				});

				return;
			}

		});


		}

}
)();
