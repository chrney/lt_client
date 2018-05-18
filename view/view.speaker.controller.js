(function() {
	'use strict';

  angular
	.module('view').controller('view.speaker.controller', viewSpeakerControllerFn);

		viewSpeakerControllerFn.$inject = [
		'rest.service',
		'$scope',
		'view.service',
		'$rootScope',
		'$window',
		'appConstants',
		'login.service',
	];

	function viewSpeakerControllerFn(restService, $scope, viewService, $rootScope, $window, appConstants, loginService) {

		var vm = this;
		vm.lockScreen = true;

		vm.actsAsSpeaker = viewService.actsAsSpeaker;
		restService.get('presence_states').getList().then(function(presence_states_response) {
			vm.attendanceStates = presence_states_response.plain();
			vm.attendanceStatesWithIdAsKeys = keysAsId(vm.attendanceStates);
		});

		restService.get('speech_types').getList().then(function(speech_types_response) {
			vm.speechTypesWithIdAsKeys = keysAsId(speech_types_response.plain());
		});

		vm.classes = ['grey', 'green', 'red'];

		vm.openAttendance = function() {

			vm.modeState = 1;

			setTimeout(function() {
				$scope.$apply();
			}, 0);

			recalculateAttendance();

		};


		function recalculateAttendance() {
			vm.numbers = [
				[ /* Dummy, för att kunna använda samma mall som omröstningen, där 0 är avstår */],
				[ /* närvarande */],
				[ /* icke närvarande */] ,
			];

			_.each(viewService.currentSeating.attendants, function(attendant) {
				var t = (vm.attendanceStatesWithIdAsKeys[attendant.type].parent == '154') ? 1 : 2;
				attendant.class = vm.classes[t];
				vm.numbers[t].push(attendant);
			});

		}

		$scope.$on('viewService:member_registered', function(ev, data) {
			recalculateAttendance();
			$scope.$apply();
		});


		vm.sendVote = function(vote) {
			if (vm.currentVoting.myVote != vote.id) {
				restService.post('votings/' + vm.currentVoting.id + '/vote', {
					'person' : viewService.currentSpeaker,
					'vote' : vote.id
				}, {
					'X-CSRF-Token' : loginService.getToken(),
				});

				vm.currentVoting.myVote = vote.id;
			}

		};


		function isAttending(attendant) {
			if (!_.isObject(attendant)) {
				attendant = _.find(vm.currentSeating.attendants, { 'person' : attendant });
			}
			return vm.attendanceStatesWithIdAsKeys[attendant.type].parent == '154';
		}

		vm.openVoting = function(voting) {

			vm.modeState = 1;
			vm.currentVoting = voting;

			var speakersVote = _.find(vm.currentVoting.votes, { 'person' : viewService.currentSpeaker });
			if (_.has(speakersVote, 'vote')) {
				vm.currentVoting.myVote = speakersVote.vote;
			}

			vm.currentVoting.buttons = [
				_.find(appConstants.VOTE_STATES, {'id': '1'}),
				_.find(appConstants.VOTE_STATES, {'id': '2'}),
				/*_.find(appConstants.VOTE_STATES, {'id': '0'})*/
			];

			vm.notAttendingCounter = 0;

			var voteCounter = 0;

			_.each(voting.votes, function(voter) {

				voter.isAttending = isAttending(voter.person);

				voter.hasVoted = voter.vote != null;

				if (voter.isAttending) {
					if (voter.hasVoted) {
						voter.class = vm.classes[voter.vote];
					}

				} else {
					vm.notAttendingCounter++;
				//	voter.vote = 'not-attending';
				}

				if (voter.hasVoted) {
					voteCounter++;
				}

			});

			vm.numbers = (_.groupBy(voting.votes, 'vote'));

			vm.votesLeftToCount = voting.votes.length - voteCounter - vm.notAttendingCounter;



		};

		$scope.$on('viewService:vote_added', function(ev, data) {
			var voter = _.find(vm.currentVoting.votes, { 'person' : data.id });
			voter.vote = data.state;
			voter.class = vm.classes[data.state];
			vm.numbers = (_.groupBy(vm.currentVoting.votes, 'vote'));

			$scope.$apply();

		});

		$scope.$on('viewService:micAutoOffState', function(ev, data) {
			vm.micAutoOffState = viewService.micAutoOffState;
			$scope.$apply();
		});

		$scope.$on('viewService:setTimer', function() {
			vm.timer = viewService.timer;
			setTimeout(function() {
				$scope.$apply();
			}, 0);
		});

		$scope.$on('viewService:updatedTimer', function() {
			if (viewService.timer.left <= 0 && viewService.timer.ticking && vm.micAutoOffState) {
				restService.post('system/mic_all_delegates_off', {
					'allMicsOff' : true
				}, {
					'X-CSRF-Token' : loginService.getToken(),
				});
			}
		});

		$scope.$on('viewService:setSeating', function() {
			vm.currentSeating = viewService.currentSeating;
			vm.lockScreen = false;
			vm.seatingActive = viewService.seatingActive();
			vm.actsAsSpeaker = viewService.actsAsSpeaker;

			//vm.currentSpeaker = _.find(vm.currentSeating.attendants, { 'person' : viewService.currentSpeaker });

		});

		$scope.$on('viewService:lockScreen', function(ev, id) {
			vm.lockScreen = true;
		});

		$scope.$on('viewService:setCase', function(ev, id) {
			vm.currentCase = _.find(vm.currentSeating.items, { 'id' : id });

			if (id) {
				setTimeout(function() {
					viewService.scrollToItem(id);
				}, 500);
			}
		});



		$scope.$on('viewService:setSpeaker', function() {
			vm.isSpeaker = viewService.isSpeaker;
			if (_.has(vm.currentSeating, 'attendants')) {
				vm.currentSpeaker = _.find(vm.currentSeating.attendants, { 'person' : '' + viewService.currentSpeaker });
			}

		});

		$scope.$on('viewService:setSpeakersList', function(ev, skipApply) {
			vm.speakersList = viewService.speakers;
			vm.countReplies = vm.currentSeating.type == '1' ? _.sumBy(vm.speakersList, { 'indent' : '1' }) : 0;
			setTimeout(function() {
				$scope.$apply();
			}, 0);
		});

		$rootScope.$on('viewService:mode_changed', function(ev, response) {

			/* if previous wasn't default and current is default, wait a bit and change to default again */
			if (vm.mode && vm.mode != '' && viewService.mode.mode == '') {

				if (vm.mode == 'vote' || vm.mode == 'attendance') {
					setTimeout(function() {
						vm.modeState = 0;
						$scope.$apply();
					}, 0);
				}

				setTimeout(function() {
					vm.mode = '';
					$scope.$apply();
					viewService.setMode('', null);
				}, 5000);
				return;
			}

			vm.mode = viewService.mode.mode;

			console.error(vm.mode);
			if (vm.mode == 'vote' ) {
				restService.get('votings').one(response.data.id).get().then(function (votingResponse) {
					vm.currentVoting = votingResponse.plain();
					vm.openVoting(vm.currentVoting);
				});
				return;
			}

			if (vm.mode == 'attendance') {
				vm.attendance = response.data;
				vm.openAttendance();
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
