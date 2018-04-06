(function() {
	'use strict';

  angular
	.module('client.main').controller('client.main.right.controller', clientMainRightControllerFn);

	clientMainRightControllerFn.$inject = [
		'rest.service',
		'client.generic.service',
		'login.service',
		'$scope',
		'$rootScope',
		'Notification',
		'appConstants',
	];

	function clientMainRightControllerFn(restService, clientGenericService, loginService, $scope, $rootScope, Notification, appConstants) {
		var vm = this;

		vm.requestSpeech = function(btn) {

			var currentEvent = _.first(_.filter(clientGenericService.currentSeating.items, function(i) {
				return i.id === clientGenericService.currentSeating.current_item;
			}));

			var obj = {
				'branch': currentEvent.id,
				'name' : '',
				'parent' : 0,
				'finalized' : 0,
				'type' : btn.id,
				'person' : clientGenericService.user.person.id,
			};

			if (btn.parent) { /* Replik? */
				obj.parent = btn.parent;
			}

			if (btn.target) { /* Fråga med mottagande minister? */
				obj.target = btn.target;
			}
			restService.post(
				'comments',
				obj,
				{ 'X-CSRF-Token' : loginService.getToken() }
			).then(function(success) {
				console.log('new!');
				vm.rightContentShowButtons = false;
			}, function(error) {
				alert('no');
			});

		};

		vm.removeSpeech = function(commentId, isSelf) {
			if (isSelf) {
				restService.delete('comments/' + commentId, {'X-CSRF-Token': loginService.getToken()});
			}
			vm.rightContentShowButtons = false;
		};

		function generateButtons(src) {

			if (_.has(clientGenericService, 'user.person.id' )) {
				console.log(clientGenericService.user, '...');

				var thisPerson = clientGenericService.user.person.id,
					thisSeating = clientGenericService.getSeating(),
					inSpeakersList;

				vm.speakersList = _.map(vm.speakersList, function (item) {
					item.isSelf = item.person == thisPerson;
					return item;
				});

				if (vm.seatingType == appConstants.SEATING_TYPES[0].id) {

					var singleOrGroupArray = [ appConstants.SEATING_TYPES[0].buttons.single, appConstants.SEATING_TYPES[0].buttons.group ];

					vm.buttons = _.map(vm.buttons, function (btn) {

						btn.speechMode = 'disabled';
						inSpeakersList = false;


						if (btn.id == appConstants.SEATING_TYPES[0].buttons.reply) { /* REPLIK */

							var firstInList = _.first(vm.speakersList);

							if (firstInList && firstInList.person != thisPerson && _.includes(singleOrGroupArray, firstInList.type)) {
								btn.speechMode = 'clickable';
								inSpeakersList = _.find(vm.speakersList, {'person': thisPerson, 'type': appConstants.SEATING_TYPES[0].buttons.reply});
								if (inSpeakersList) {
									btn.speechMode = 'recallable';
									btn.speechId = inSpeakersList.id;
								} else {
									btn.parent = firstInList.id;
								}
							}
						}

						if (_.includes(singleOrGroupArray, btn.id)) {
							inSpeakersList = _.find(vm.speakersList, function (t) {
								return t.person == thisPerson && _.includes(singleOrGroupArray, t.type);
							});
							if (!inSpeakersList) {
								btn.speechMode = 'clickable';
							} else {
								if (inSpeakersList.type == btn.id) {
									btn.speechMode = 'recallable';
									btn.speechId = inSpeakersList.id;
								}
							}

						}

						return btn;
					});

				} else { /* FRÅGESTUND */

					vm.buttons = _.map(vm.ministers, function (btn) {

						btn.speechMode = 'disabled';

						inSpeakersList = _.find(vm.speakersList, function (t) {
							return t.person == thisPerson && t.type == appConstants.SEATING_TYPES[1].buttons.question;
						});

						if (!inSpeakersList) {
							btn.speechMode = 'clickable';
						} else {
							var askQuestionFor = _.find(vm.speakersList, { 'parent' : inSpeakersList.id,  'person' : btn.target });
							if (inSpeakersList.type == btn.id && askQuestionFor) {
								btn.speechMode = 'recallable';
								btn.speechId = inSpeakersList.id;
							}
						}

						return btn;
					});


				}
			} else {
				alert('Inloggad som användare som inte har en person knuten till sig.');
			}
		}

		$scope.$on('client.generic:setSeating', function(ev, data) {
			vm.isActive = clientGenericService.seatingActive();

			vm.seatingType = data.type;
			vm.isQuestionSeating = data.type ==  appConstants.SEATING_TYPES[1].id

			if (vm.isQuestionSeating) {
				vm.ministers = clientGenericService.ministers;
			} else  { /* Plenum */

				vm.buttons = clientGenericService.speechButtons;
				vm.types = keysAsId(vm.buttons);

			}

		});

		$rootScope.$on('case_updated', function(ev, data) {
			var t = _.find(clientGenericService.currentSeating.items, { 'id' : clientGenericService.currentSeating.current_item }).case.id;

			if (t == data) {
				clientGenericService.getSpeakersList();
			}

			$scope.$broadcast('mode_changed', data);
		});

		$rootScope.$on('mode_changed', function(ev, response) {

			vm.isMinister = clientGenericService.isMinister();
			vm.narrowCol = (response.mode == ''  || vm.isMinister);

			if (response.mode === 'attendance' && !vm.isMinister) {
				Notification.success('Närvaroregistrering påbörjades');
				vm.details = response;
				vm.checkin = function() {

					restService.post('seatings/' + clientGenericService.currentSeating.id + '/register', {
						'person' : loginService.currentUser.member.id,
						'state' : '163'
					}, {
						'X-CSRF-Token' : loginService.getToken(),
					}).then(function(r) {
						$rootScope.$broadcast('xmode_changed', {
							'mode' : '',
						});
						Notification.success('Närvaro registrerad');
					});
				}

			} else if (response.mode === 'vote' && !vm.isMinister) {
				Notification.success('Omröstning');

				vm.details = response;
				vm.details.helper = appConstants.VOTE_STATES;

				restService.get('votings').one(response.data.id).get().then(function (voting) { /* get current voting */
					vm.details.data = voting;
				});

				vm.details.btn = function(vote) {
					restService.post('votings/' + vm.details.data.id + '/vote', {
						'person' : loginService.currentUser.id,
						'vote' : vote
					}, {
						'X-CSRF-Token' : loginService.getToken(),
					}).then(function(response) {
						vm.voted = vote;
						if (vote == 1) {
							Notification.success('Du röstade <strong>Ja</strong>');
						} else if(vote == 2) {
							Notification.error('Du röstade <strong>Nej</strong>');
						} else if(vote == 0) {
							Notification.warning('Du avstod från att rösta.');

						}
					});
				};

			} else {

				response.mode = '';
				vm.details = response;

			}

		});

		$rootScope.$on('speechtypes_updated', function(ev, data) {

		});

		$rootScope.$on('new_speakers_list', function(ev, data) { /* on init */
			$rootScope.$broadcast('ws:speakers_list_changed', { 'list' : data });
		});

		$scope.$on('ws:speakers_list_changed', function(ev, data) {
			data = _.filter(data.list, function(speaker) {
				return speaker.indent < 2;
			});
			vm.speakersList = data;

			generateButtons('speakers_list_changed');
			Notification.success({
				'message' : 'Ny talarlista',
				positionX: 'left',
				positionY: 'bottom'
			});
		});

		$rootScope.$on("ws:clientAuthenticated", function(ev, data) {
			clientGenericService.user = data;
		});


	}


}
)();
