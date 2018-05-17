(function() {
	'use strict';

  angular
	.module('view').controller('view.tv.controller', viewTvControllerFn);

		viewTvControllerFn.$inject = [
		'rest.service',
		'$scope',
		'view.service',
		'$rootScope',
		'$window',
	];

	function viewTvControllerFn(restService, $scope, viewService, $rootScope, $window) {

		var vm = this;
		vm.lockScreen = true;

		restService.get('presence_states').getList().then(function(presence_states_response) {
			vm.attendanceStates = presence_states_response.plain();
			vm.attendanceStatesWithIdAsKeys = keysAsId(vm.attendanceStates);
		});

		angular.element($window).bind('resize', function () {
		/*	$scope.$apply(function () {
				if ($window.innerWidth > 1000) {
					vm.preAngel = [0, 45, 45, 45 ];
					vm.rowDistance = [ 0, 350, 450, 550 ];
				} else {
					vm.preAngel = [0, 30, 30, 30];
					vm.rowDistance = [0, 150, 250, 350];
				}
				vm.rows = calculateStyle(vm.rows);
				vm.width = $window.innerWidth;
				vm.height = $window.innerHeight;
				console.log(vm.width);
			});
		*/
		});

		vm.classes = ['grey', 'green', 'red'];
		vm.preAngel = [0, 30, 30, 30];
		vm.rowDistance = [0, 150, 250, 350];

		vm.openAttendance = function() {

			vm.seatMap = {};

			setTimeout(function() {
				$scope.$apply();
			}, 0);

			vm.currentSpeaker = _.find(viewService.currentSeating.attendants, { 'person' : viewService.currentSpeaker });

			vm.seatMap = {
				'state' : 1,
				'classForNumbers' : 'col-xs-6',
				'question' : null,
				'heading' : 'Närvaroregistrering',
				'alternativesInText' : ['', 'Närvarande', 'Frånvarande' ],
				'containerClass' : 'map-attendance',
			};

			recalculateAttendance();

		}

		function recalculateAttendance() {
			vm.numbers = [
				[ /* Dummy, för att kunna använda samma mall som omröstningen, där 0 är avstår */],
				[ /* närvarande */],
				[ /* icke närvarande */] ,
			];

			var attendants = _.map(viewService.currentSeating.attendants, function(attendant) {
					var classIdx = isAttending(attendant) ? 1 : 2;
					attendant.class = vm.classes[classIdx];
					attendant.isSpeaker = attendant.person == viewService.currentSpeaker;

					attendant.placeWithRowAndSeat = [attendant.place.substring(0, 1), attendant.place.substring(1)];
					vm.numbers[classIdx].push(attendant);
					return attendant;
				});

			vm.rows = generateRows(attendants);

		}

		function isAttending(attendant) {
			if (!_.isObject(attendant)) {
				attendant = _.find(vm.currentSeating.attendants, { 'person' : attendant });
			}
			return vm.attendanceStatesWithIdAsKeys[attendant.type].parent == '154';
		}

		function generateRows(inData) {
			var a = [];

			inData = _.sortBy(inData, ['placeWithRowAndSeat.0', 'placeWithRowAndSeat.1']);
			_.each(_.uniqBy(inData, 'placeWithRowAndSeat.0'), function(row, rowKey) {
				var inThisRow = _.filter(inData, function(voter) {
					return voter.placeWithRowAndSeat[0] == rowKey;
				});
				a.push(_.reverse(inThisRow));
			});

			return calculateStyle(a);

		}

		function calculateStyle(source) {
			_.each(source, function(row, rowKey) {
				_.each(row, function(place, placeKey) {
					var deg = (vm.preAngel[rowKey] + (placeKey * ((180 - (2*vm.preAngel[rowKey]))/(Math.max(1, row.length-1)))));
					place.style = {
						'transform': 'rotate(' + deg + 'deg) '
						+ 'translate(' + vm.rowDistance[rowKey] + 'px)'
					};
				});
			});
			return source;
		}

		$scope.$on('viewService:member_registered', function(ev, data) {
			recalculateAttendance();
			$scope.$apply();
		});

		vm.openVoting = function(voting) {
			vm.voting = voting;

			vm.seatMap = {
				'state' : 1,
				'classForNumbers' : 'col-xs-4',
				'question' : vm.voting.title,
				'heading' : 'Omröstning',
				'alternativesInText' : ['Avstår', 'Ja', 'Nej' ],
				'containerClass' : 'map-voting',
			};

			_.each(voting.votes, function(voter) {
				if (voter.vote != null) {
					voter.class = vm.classes[voter.vote];
				};
				voter.isSpeaker = voter.person == viewService.currentSpeaker;
				voter.placeWithRowAndSeat = [voter.place.substring(0, 1), voter.place.substring(1)];

				voter.isAttending = isAttending(voter.person);
			});

			vm.currentSpeaker = _.find(voting.votes, { 'person' : viewService.currentSpeaker });

			vm.numbers = (_.groupBy(voting.votes, 'vote'));
			vm.rows = generateRows(voting.votes);

		};

		$scope.$on('viewService:vote_added', function(ev, data) {
			var voter = _.find(vm.voting.votes, { 'person' : data.id });
			voter.vote = data.state;
			voter.class = vm.classes[data.state];
			vm.numbers = (_.groupBy(vm.voting.votes, 'vote'));

			$scope.$apply();

		});

		$scope.$on('viewService:setTimer', function() {
			vm.timer = viewService.timer;
			setTimeout(function() {
				$scope.$apply();
			}, 0);
		});


		$scope.$on('viewService:setSeating', function() {
			vm.currentSeating = viewService.currentSeating;
			vm.lockScreen = false;
			vm.seatingActive = viewService.seatingActive();
		});

		$scope.$on('viewService:lockScreen', function(ev, id) {
			vm.lockScreen = true;
		});

		$scope.$on('viewService:setCase', function(ev, id) {
			var currentCaseIdx = _.findIndex(vm.currentSeating.items, { 'id' : id });
			if (currentCaseIdx > -1) {
				vm.currentCase = vm.currentSeating.items[currentCaseIdx];
				if (_.has(vm.currentSeating.items, '' + (currentCaseIdx + 1))) {
					vm.nextCase = vm.currentSeating.items[currentCaseIdx + 1];
				} else {
					vm.nextCase = null;
				}
			} else {
				vm.nextCase = null;
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

		$scope.$on('viewService:setSpeakersList', function(ev, skipApply) {
			vm.speakersList = viewService.speakers;
			setTimeout(function() {
				$scope.$apply();
			}, 0);
		});

		$rootScope.$on('viewService:mode_changed', function(ev, response) {

			/* if previous wasn't default and current is default, wait a bit and change to default again */
			if (vm.mode && vm.mode != '' && viewService.mode.mode == '') {

				if (vm.mode == 'vote' || vm.mode == 'attendance') {
					setTimeout(function() {
						vm.seatMap.state = 0;
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


			console.log(viewService.mode.mode);
			vm.mode = viewService.mode.mode;

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
