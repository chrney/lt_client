(function() {
	'use strict';

  angular
	.module('view').factory('view.service', viewServiceFn);

	viewServiceFn.$inject = [
		'login.service',
		'ws.service',
		'$rootScope',
		'rest.service',
		'$q',
		'appConstants',
		'$interval',

	];

	 function viewServiceFn (loginService, wsService, $rootScope, restService, $q, appConstants, $interval) {

		 var service;

		 service = {

			init: function (type, isGovernor) {

				switch(type) {
					case 'tv':
						service.registerWSevents();
						//wsService.withCredentials = false;
						wsService.registerUser();
						break;

					case 'speaker':
						loginService.init().then(function () {
							service.registerWSevents();
							wsService.registerUser();
						});
						break;

					default: /* ledamöterna or isGovernor */

						var defaultPromise = loginService.init();

						if (isGovernor) {

							defaultPromise = new Promise( /* make dummy promise to keep the pattern further down here */
								function (resolve) {
									resolve(null); // fulfilled
								}
							);

						} else {
							defaultPromise = loginService.init();
						}

						service.isGovernor = isGovernor;

						defaultPromise.then(function () {
							service.registerWSevents();
							wsService.registerUser();
						});
				}


			},

			registerWSevents: function() {
				$rootScope.$on('ws:seating_state_changed', function (ev, data) {
					service.getNearestSeating();
				});

				$rootScope.$on("ws:clientAuthenticated", function (ev, data) {
					service.user = data;

					var roles = _.values(service.user.roles);
					_.each(['ledamot', 'minister', 'talman'], function(str) {
						service.user['is' + _.startCase(_.toLower(str))] = _.includes(roles, str);
					});

					service.actsAsSpeaker = service.user.uid == '217';

					service.user.isAnonymous = !service.user.isLedamot && !service.user.isMinister && !service.user.talman && !service.actsAsSpeaker;

					if (service.isGovernor) {
						service.user.isAnonymous = false;
						service.user.isMinister = true; /* set this to true to avoid närvaro and votings */
						service.user.isLedamot = false;
						service.user.person = { 'id' : 0, 'name' : 'Landshövding', 'uid' : 0 };
					}

					$rootScope.$broadcast('viewService:clientAuthenticated');

					service.getNearestSeating();
				 });

				 $rootScope.$on('ws:attendance_check_changed', function (ev, data) {
					 if (data.attendance_check == 1) { /* attendance_check activated */
						 service.setMode('attendance', data);
					 } else {
						 service.setMode(''); // speakers list
					 }
				 });

				 $rootScope.$on('ws:voting_state_changed', function (ev, data) {
					 if (data.state == 1) { /* voting activated */
						 service.setMode('vote', data);
					 } else {
						 service.setMode(''); // speakers list
					 }

				 });

				 $rootScope.$on('ws:current_item_changed', function(ev, data) {
					 service.setCase(data.current_item);
				 });

				 $rootScope.$on('ws:speech_types_changed', function(ev, data) {
				 	if (!service.user.isAnonymous) {
						service.setButtons(data.list);
					}
				 });

				 $rootScope.$on('ws:item_sequence_changed', function(ev, data) {
					 service.getNearestSeating();
				 });

				 $rootScope.$on('ws:speakers_list_changed', function(ev, data) {
					 if (service.user.isAnonymous) {
						 service.setSpeakersList(data.compact);
					 } else {
						 service.setSpeakersList(data.normal);
					 }
					 service.setTimer(data.timer);
				 });

				 $rootScope.$on('ws:timer_changed', function(ev, data) {
				 	service.setTimer(data.timer);
				 });

				 $rootScope.$on('ws:check_unlock', function(ev, data) {
					 service.getNearestSeating();
				 });

				 $rootScope.$on('ws:speaker_changed', function(ev, data) {
					 service.setSpeaker(data.id);
				 });


				$rootScope.$on('ws:vote_added', function(ev, data) {
					$rootScope.$broadcast('viewService:vote_added', data);
				});

				$rootScope.$on('ws:member_registered', function(ev, data) {
					service.currentSeating.attendants = data;
					$rootScope.$broadcast('viewService:member_registered', data);
				});

			 },

			getNearestSeating: function () {
				restService.get('seatings/?today=true').getList().then(function (data) { /* FL = 3, pågående = 4 */
					if (data.length >= 1) {
						service.getFullSeating(_.first(data.plain()).id);
					} else {
						$rootScope.$broadcast('viewService:lockScreen');
					}
				});
			},

			 getFullSeating: function (seating) {

				 var defer = $q.defer();

				 if (!_.isObjectLike(seating)) {
					 restService.get('seatings').one(seating).get({ 'comments' : 'true'}).then(function (data) {
						 defer.resolve(data.plain());
					 });
				 } else {
					 defer.resolve(seating);
				 }

				 return defer.promise.then(function (data) {

					if (window.location.href.indexOf('type2') !== -1) {/* fake frågestund */
						data.type = '2';
					}

					data.ts = new Date(data.date).getTime();

					data.allItems = _.map(data.items, 'id');
					data.items = _.filter(data.items, {'source': 'events'});
					if (_.has(data, 'activities')) { /* find last talmansbyte */
						var currentSpeaker = _.findLast(data.activities, { 'type' : '235' });
						if (_.has(currentSpeaker, 'target.id')) {
							service.setSpeaker(currentSpeaker.target.id);
						}
					}

					if(data.type == '2') {
						 return data;
					}

					 /* filter so we'll only get events */
					return restService.get('events/' + _.map(data.items, 'id').join(',') + '?as_array=true').getList().then(function (eventData) {
						var events = keysAsId(eventData.plain());
						data.items = _.map(data.items, function (event) {
							event = events[event.id];
							return event;
						});
						return data;
					});

				 }).then(function (data) {

					 if(data.type == '2') {
						 return { 'seating' : data };
					 }

					 var agregateLists = {
						 'cases': [],
						 'event_types': []
					 };

					 _.each(data.items, function (v) {
						 agregateLists.event_types.push(v.type);
						 agregateLists.cases.push(v.case);
					 });

					 return {
						 'agregateLists': agregateLists,
						 'seating': data,
					 }

				 }).then(function (obj) {

					 if(obj.seating.type == '2') {
						 return obj;
					 }

					 var dataPromises = {};

					 _.each(obj.agregateLists, function (subNodeValues, subNodeKeys) {
						 obj.agregateLists[subNodeKeys] = _.uniq(obj.agregateLists[subNodeKeys]);
						 if (obj.agregateLists[subNodeKeys].length > 0) {
							 dataPromises[subNodeKeys] = restService.get(subNodeKeys + '/' + obj.agregateLists[subNodeKeys].join(',') + '?as_array=true&documents=true').getList().then(function (returnData) {
								 return keysAsId(returnData.plain());
							 });
						 }
					 });


					 return {
						 'seating': obj.seating,
						 'dataPromises': dataPromises
					 };

				 }).then(function (obj) {

					console.log(obj.seating);

					 if (obj.seating.type == '2') {

						service.currentSeating = obj.seating;
						$rootScope.$broadcast('viewService:setSeating', service.currentSeating);

						if (!service.user.isAnonymous && !service.actsAsSpeaker) {
							service.getMinisters().then(function(data) {
								service.ministers = data;
								$rootScope.$broadcast('viewService:setMinisters', service.ministers);
							});
						}


						 restService.post(
							 'system/speakers_list', { },
							 { 'X-CSRF-Token' : loginService.getToken() }

						 ).then(function(speakersList) {
							 service.setSpeakersList(speakersList.plain());
						 });


						service.user.mustCheckin = false;
						service.setMode('');

						return obj.seating;
					 }

					 return $q.all(obj.dataPromises).then(function (dataPromisesResult) {

						_.each(dataPromisesResult, function (v, k) {
							 dataPromisesResult[k] = keysAsId(v);
						});

						var findFirstInSeparareList = _.findIndex(obj.seating.items, { 'separate_list' : '1' });
						if (findFirstInSeparareList > -1) {
							 obj.seating.items[findFirstInSeparareList].showSeparateHeader = true;
						}

						obj.seating.items = _.map(obj.seating.items, function (item, idx) {
							item.case = dataPromisesResult.cases[item.case];
							item.type = dataPromisesResult.event_types[item.type];
							item.headline = item.type.title;
							item.idx = idx + 1;
							return item;
						});

						service.currentSeating = obj.seating;
						$rootScope.$broadcast('viewService:setSeating', service.currentSeating);

						service.setCase(service.currentSeating.current_item);

						if (service.currentSeating.type == 1 && !service.user.isAnonymous && !service.actsAsSpeaker) {
							restService.get('speech_types').getList().then(function(speech_types_response) {
								service.setButtons(speech_types_response.plain());
							});
						}

						restService.post(
							'system/speakers_list', { },
							{ 'X-CSRF-Token' : loginService.getToken() }
						).then(function(speakersList) {
							speakersList = speakersList.plain();
							speakersList = service.user.isAnonymous ? speakersList.compact : speakersList.normal;
							service.setSpeakersList(speakersList, true); /* skip apply here */
						});

						service.getTimer();

						if (
							(service.user.isLedamot || service.user.isAnonymous || service.actsAsSpeaker)
							&& service.currentSeating.state == 4
							&& service.currentSeating.type == 1
						) {
								service.user.mustCheckin = service.user.isLedamot ? true : false;

								if ((service.actsAsSpeaker && service.currentSeating.attendance_check == 1) || service.user.isLedamot || service.currentSeating.attendance_check == 1) {

									service.setMode('attendance', {
										'attendance': 1,
										'seating': service.currentSeating.id
									});
								} else {
									service.user.mustCheckin = false;
									service.setMode('');
								}
						} else {
							service.user.mustCheckin = false;
							service.setMode('');
						}
					 });
				 });

			 },

			 getTimer: function() {
				 restService.post(
					 'system/timer', { },
					 { 'X-CSRF-Token' : loginService.getToken() }

				 ).then(function(timerData) {
					 if (timerData.started) {
					 	service.setTimer(timerData.plain());
					 }
				 });
			 },

			 intervalInstance: null,

			 broadcast: function() {

				 if (service.timer.started == 0) {
					 service.timer.left = 0;
					 service.timer.percentage = null;

					 if (service.intervalInstance) {
						 $interval.cancel(service.intervalInstance);
						 service.timer.ticking = false;
					 }

				 } else {
					 service.timer.left =  (service.timer.started + service.timer.duration) - service.timer.time;
					 service.timer.percentage = service.timer.left <= 0 ? 100 : (100 - (service.timer.left * 100 / service.timer.duration));
				 }

				 $rootScope.$broadcast('viewService:updatedTimer', service.timer);

			 },

			 setTimer: function(data) {
				service.timer = data;

				 /* always cancel ongoing timer */
				 $interval.cancel(service.intervalInstance);

				 service.broadcast();

				 if (service.timer.started != 0 && !service.timer.ticking) {

					 service.timer.ticking = true;
					 service.intervalInstance = $interval(function() {
						 service.timer.time++;
						 service.broadcast();
					 }, 1000);

				 }

				$rootScope.$broadcast('viewService:setTimer');
			 },

			 setSpeaker: function(id) {
				service.currentSpeaker = id;
				service.isSpeaker =
					(!service.user.isAnonymous && _.has(service.user, 'person.id') && service.currentSpeaker == service.user.person.id)
				$rootScope.$broadcast('viewService:setSpeaker');
			 },

			 setSpeakersList: function(data, skipApply) {
				service.speakers = data;

				var lastSpoken = _.findLast(service.speakers, { 'status' : '1' });
				if (lastSpoken) {
					lastSpoken.isLast = true;
				}

				if (service.actsAsSpeaker) {

				} else {
					if (service.currentSeating.type == 1 && service.user.isLedamot) {
						service.enableAndDisableButtons();
					}

					if (service.currentSeating.type == 2 && service.user.isLedamot) {
						service.enableAndDisableMinisters();
					}
				}


				$rootScope.$broadcast('viewService:setSpeakersList', skipApply);
			 },

			 setButtons: function(buttons) {

				var validButtons = _.values(appConstants.SEATING_TYPES[0].buttons);

				service.buttons = _.filter(buttons, function(button) {
					return _.includes(validButtons, button.id);
				});

				if (!service.user.isAnonymous && !service.actsAsSpeaker) {
					service.enableAndDisableButtons();
				}


				$rootScope.$broadcast('viewService:setButtons', service.buttons);

			 },

			 enableAndDisableMinisters: function() {

				var usersQuestion = _.find(service.speakers, {
					'person' : service.user.person.id,
					'type' : appConstants.SEATING_TYPES[1].buttons.question
				});

				var questionsTarget = null;

				if (usersQuestion) {
					questionsTarget = _.find(service.speakers, { 'parent' : usersQuestion.id }).person;
				}

				var currentQuestion = _.find(service.currentSeating.items, { 'id' : service.currentSeating.current_item });

				 service.ministers = _.map(service.ministers, function(button) {
					 button.active = button.id == questionsTarget;
					 button.disabled = !button.active && questionsTarget || !currentQuestion;
					 return button;
				 });
			 },

			 enableAndDisableButtons: function() {
				 var usersSpeeches = [];
				 if (_.has(service.user, 'person.id')) {
					 usersSpeeches = _.map(
						 _.filter(service.speakers, { 'person' : service.user.person.id}),
						 'type'
					 );
				 }

				 service.buttons = _.map(service.buttons, function(button) {
					 button.active = _.includes(usersSpeeches, button.id);
					 return button;
				 });

				 var firstSpeechNonRegular = _.find(service.speakers, function (speaker) {
					 return speaker.indent == 0 && speaker.type != 217; /* tal */
				 }),
					 replyButton = _.find(service.buttons, {'id': appConstants.SEATING_TYPES[0].buttons.reply});

				 replyButton.disabled = true;
				 if (firstSpeechNonRegular) {
					replyButton.disabled = (service.user.person.id == firstSpeechNonRegular.person);
				 }

				 var options = [ 'group', 'single' ];

				 _.each(options, function(option) {

					var counterOption = _.first(_.without(options, option)),
						counterButtonIsActive = _.findIndex(service.speakers, {
							 'type' : appConstants.SEATING_TYPES[0].buttons[counterOption],
							 'person' : service.user.person.id
						 }) > -1,
						checkButton = _.find(service.buttons, { 'id' : appConstants.SEATING_TYPES[0].buttons[option] });

					 checkButton.disabled = counterButtonIsActive;

				 });

				 service.buttons = _.map(service.buttons, function(btn) {
					if (btn.button_visible == '0' && !btn.active) {
						btn.disabled = true;
					}

					return btn;
				 });

				 var thisItem = _.find(service.currentSeating.items, { 'id' : service.currentSeating.current_item }),
					 noDiscussionAllowed = true;

				 if (_.has(thisItem, 'type.in_seating')) {
					noDiscussionAllowed = thisItem.type.in_seating != '2'; /* in_seating == 2 in åtgärdstyper means discusable in seating */
				 }

				 var eventIds = _.map(service.currentSeating.items, 'id'),
					 isInfo = !_.includes(eventIds, service.currentSeating.current_item);


				 /* Disable all buttons if info or if speaker has not begun yet, or if of type 'non discussion allowed', or if isGovernor */
				 if (
					noDiscussionAllowed
					||
					isInfo
					 ||
					 (_.has(service, 'speakers[0].type') && service.speakers[0].status == '0')
					 ||
					 service.isGovernor
				 ) {
					service.buttons = _.map(service.buttons, function(button) {
						 button.disabled = button.active ? false : true;
						 return button;
					 });
				 }

			 },

			setCase: function(id) {

				 service.currentSeating.current_item = id;

				 var foundItemIdx = _.indexOf(service.currentSeating.allItems, id);

				 if (foundItemIdx == -1) {
					 foundItemIdx = Infinity;
				 }

				 service.currentSeating.items = _.map(service.currentSeating.items, function(item, idx) {
					var positionInCompleteList = _.indexOf(service.currentSeating.allItems, item.id);

					item.hasPassed = positionInCompleteList < foundItemIdx;
					return item;
				 });

				 $rootScope.$broadcast('viewService:setCase', id);

			 },

			 setMode: function (mode, obj) {

				 service.mode = {
					 'mode': mode,
					 'data': obj
				 };
				 $rootScope.$broadcast('viewService:mode_changed', service.mode);

			 },

			 seatingActive: function () {
				 return parseInt(service.currentSeating.state, 10) === 4;
			 },

			 getMinisters: function () {

				 return restService.get('organizations/' + appConstants.GOVERNMENT.organization + '/persons/1/' + appConstants.GOVERNMENT.roles.join(',')).getList().then(function (persons) {

					var ministers =  persons.plain(),
						out = [];

					ministers = _.map(ministers, function(minister) {
						minister.type = _.indexOf(appConstants.GOVERNMENT.roles, minister.roles[0].role_id);
						minister.role_title = minister.roles[0].role_title;
						return minister;
					});

					ministers = _.orderBy(ministers, ['type', 'last_name', 'first_name'], [ 'asc', 'asc', 'asc' ]);

					return ministers;

				 });

			 },

			 scrollToItem: function(id) {

				 if (id) {
					 var foundItem = document.getElementById("item-" + id),
						 elem = document.getElementById('agenda-list');

					 if (elem) {
						 if (!_.isNull(foundItem)) {
							 elem.scrollTop = foundItem.offsetTop;
						 } else {
							 elem.scrollTop = 0;
						 }
					 }
				 }
			 },

		 };

		 return service;
	}

})();
