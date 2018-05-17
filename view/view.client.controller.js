(function() {
	'use strict';

  angular
	.module('view').controller('view.client.controller', viewClientControllerFn);

		viewClientControllerFn.$inject = [
		'rest.service',
		'$scope',
		'view.service',
		'$rootScope',
		'$ocModal',
		'$sce',
		'appConstants',
		'login.service',
	];

	function viewClientControllerFn(restService, $scope, viewService, $rootScope, $ocModal, $sce, appConstants, loginService) {

		var vm = this;

		vm.lockScreen = true;

		$scope.$on('viewService:setSeating', function() {
			vm.currentSeating = viewService.currentSeating;
			vm.lockScreen = false;

			vm.isGovernor = viewService.isGovernor;

			if (viewService.seatingActive() && viewService.user.isLedamot && viewService.currentSeating.type == 1) {
				var check = _.find(vm.currentSeating.attendants, { 'person' : viewService.user.person.id });
				vm.mustCheckin = check.type != '163' && check.type != '159'; // dvs inte närvarande (än)
			} else {
				vm.mustCheckin = false;
			}

			vm.seatingActive = viewService.seatingActive();

			setTimeout(function() {
				viewService.scrollToItem(viewService.currentSeating.current_item);
			}, 500);
		});

		$scope.$on('viewService:lockScreen', function(ev, id) {
			vm.lockScreen = true;
		});

		$scope.$on('viewService:setCase', function(ev, id) {
			if (id) {
				viewService.scrollToItem(id);
			}
		});

		$scope.$on('viewService:setButtons', function() {
			vm.buttons = viewService.buttons;
		});

		$scope.$on('viewService:setMinisters', function() {
			vm.ministers = viewService.ministers;
		});

		$scope.$on('viewService:setSpeaker', function() {
			vm.isSpeaker = viewService.isSpeaker;
		});

		$scope.$on('viewService:setSpeakersList', function() {
			vm.speakersList = viewService.speakers;
			var ids = _.map(viewService.speakers, 'id');

			/* hide 'confirm to cancel question'-dialog */
			if (vm.showCancelQuestion && !_.includes(ids, vm.showCancelQuestion)) {
				vm.showCancelQuestion = false;
			}

			/* hide 'confirm to cancel speech'-dialog */
			if (vm.showCancelSpeech && !_.includes(ids, vm.showCancelQuestion)) {
				vm.showCancelSpeech = false;
			}
		});

		vm.requestSpeech = function(button) {

			if (!button.active) { /* nytt tal */

				var parentId = 0;

				if (button.id == appConstants.SEATING_TYPES[0].buttons.reply) {

					parentId = _.find(viewService.speakers, function (speaker) {
						return speaker.indent == 0 && speaker.type != 217; /* tal */
					});
					if (parentId) {
						parentId = parentId.id;
					}
				}

				restService.post(
					'comments',
					{
						'branch': viewService.currentSeating.current_item,
						'parent': '' + parentId,
						'target':  {
							'id' : viewService.user.person.id
						},
						'type' : button.id,
					},
					{ 'X-CSRF-Token' : loginService.getToken() }
				);

			} else {
				showCancelDialog(button.id);
			}
		};

		vm.requestQuestion = function(button) {

			if (!button.active) { /* nytt tal */

				restService.post(
					'comments',
					{
						'branch': viewService.currentSeating.current_item,
						'parent': '0',
						'target':  {
							'id' : viewService.user.person.id
						},
						'type' : appConstants.SEATING_TYPES[1].buttons.question,
						'answer_id' : button.id
					},
					{ 'X-CSRF-Token' : loginService.getToken() }
				);
			} else {
				showCancelDialog(appConstants.SEATING_TYPES[1].buttons.question);
			}
		};

		function showCancelDialog(commentType) {
			vm.showCancelSpeech = commentType;
			setTimeout(function() {
				vm.showCancelSpeech = null;
			}, 800000);
		}

		vm.deleteSpeech = function() {

			/* find my speech with a set type */
			var commentToDelete = _.find(viewService.speakers, {
				'type' : vm.showCancelSpeech,
				'person' : viewService.user.person.id
			});

			if (commentToDelete) {
				restService.delete(
					'comments/' + commentToDelete.id,
					{'X-CSRF-Token': loginService.getToken()}
				).then(function (success) { /* reload */
					vm.showCancelSpeech = null;
				});
			} else {
				vm.showCancelSpeech = null;
			}
		};

		vm.openDocument = function (obj) {
			obj.sanitizedPath = $sce.trustAsResourceUrl("https://view.lagtinget.ax/proxy.php?file=" + obj.path);
			$ocModal.open({
				url: '/view/templates/document.tpl.html',
				cls: 'fade-in',
				init: {
					doc: obj
				},

				onOpen: function() { }
			});
		}

		vm.openVoting = function (obj) {

			if (!vm.isSpeaker && !vm.lockScreen) {

				setTimeout(function() {
					$ocModal.open({
						url: '/view/templates/voting.tpl.html',
						cls: 'fade-in',
						init: {
							vm : vm,
						},

						onOpen: function() { }
					});
				}, 500);
			}
		}

		vm.openAttendance = function () {
			$ocModal.open({
				url: '/view/templates/attendance.tpl.html',
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

		vm.sendVote = function(vote) {
			if (vm.currentVoting.myVote != vote.id) {
				restService.post('votings/' + vm.currentVoting.id + '/vote', {
				/*	'person' : loginService.currentUser.member.id,*/
					'vote' : vote.id
				}, {
					'X-CSRF-Token' : loginService.getToken(),
				});
			}
			vm.currentVoting.myVote = vote.id;

		};

		$rootScope.$on('ws:user_vote_added', function(ev, response) {
			vm.currentVoting.myVote = response;
			$scope.$apply();
		});

		$rootScope.$on('viewService:mode_changed', function(ev, response) {

			if (!viewService.user.mustCheckin) { /* closed voting: hide vote-modal. Likewise  */
				$ocModal.close();
			}

			vm.mode = viewService.mode.mode;

			if (viewService.user.mustCheckin && viewService.mode.mode != 'attendance') {
				return;
			}

			if (vm.mode == 'vote'
				&& viewService.user.isLedamot
				&& !viewService.user.mustCheckin
				&& viewService.seatingActive()
			) {
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

					vm.currentVoting = response.data;
					vm.openVoting(vm.currentVoting);
				});

				return;
			}

			if (vm.mode == 'attendance'
				&& viewService.user.mustCheckin
				&& viewService.seatingActive()
			) {
				vm.attendance = response.data;
				var thisCheck = _.find(viewService.currentSeating.attendants, {'person': viewService.user.person.id});
				if (thisCheck.type == '163' || thisCheck.type == '159') { /* already checked in */
					viewService.user.mustCheckin = false;
					viewService.setMode('', {});
				} else {
					viewService.user.mustCheckin = true;
					vm.openAttendance();
				}
				vm.mustCheckin = viewService.user.mustCheckin;

				return;
			}

			if (vm.mode == '') {
				restService.get('votings/?open=1').getList().then(function(openVotings) {
					openVotings = openVotings.plain();
					if (openVotings.length > 0) {
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
