(function() {
	'use strict';

  angular
	.module('dj.main').controller('dj.main.right.controller', djMainRightControllerFn);

	djMainRightControllerFn.$inject = [
		'rest.service',
		'dj.generic.service',
		'login.service',
		'$scope',
		'$rootScope',
		'Notification',
		'appConstants',
	];

	function djMainRightControllerFn(restService, djGenericService, loginService, $scope, $rootScope, Notification, appConstants) {
		var vm = this;


		vm.removeSpeech = function(commentId, isSelf) {
			if (isSelf) {
				restService.delete('comments/' + commentId, {'X-CSRF-Token': loginService.getToken()});
			}
			vm.rightContentShowButtons = false;
		};

		function generateButtons(src) {

			if (djGenericService.user) {

				var thisPerson = djGenericService.user.person.id,
					thisSeating = djGenericService.getSeating(),
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
			}
		}

		$scope.$on('dj.generic:setSeating', function(ev, data) {

			vm.seatingType = data.type;

			if (data.type == '1') { /* Plenum */

				vm.buttons = djGenericService.speechButtons;
				vm.types = keysAsId(vm.buttons);

			} else {

				vm.ministers = djGenericService.ministers;

			}

		});

		$rootScope.$on('case_updated', function(ev, data) {
			var t = _.find(djGenericService.currentSeating.items, { 'id' : djGenericService.currentSeating.current_item }).case.id;

			if (t == data) {
				djGenericService.getSpeakersList();
			}

			$scope.$broadcast('mode_changed', data);
		});

		$rootScope.$on('mode_changed', function(ev, response) {



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

		$rootScope.$on("ws:djAuthenticated", function(ev, data) {
			djGenericService.user = data;
		});


	}


}
)();
