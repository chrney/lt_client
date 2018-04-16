
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

	];

	 function viewServiceFn (loginService, wsService, $rootScope, restService, $q, appConstants) {

		 var service;

		 service = {

			 init: function () {

				 loginService.init().then(function () {

					 $rootScope.$on('ws:seating_state_changed', function (ev, data) {

						 	 service.getNearestSeating();

					 });

					 $rootScope.$on("ws:clientAuthenticated", function (ev, data) {
						service.user = data;

						var roles = _.values(service.user.roles);
						 _.each(['ledamot', 'minister', 'talman'], function(str) {
							 service.user['is' + _.startCase(_.toLower(str))] = _.includes(roles, str);
						 });

						 $rootScope.$broadcast('viewService:clientAuthenticated');

						 service.getNearestSeating();
					 });

					 $rootScope.$on('ws:attendance_check_changed', function (ev, data) {
						 if (data.attendance == 1) { /* attendance_check activated */
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
					 	service.setButtons(data.list);
					 });

					 $rootScope.$on('ws:item_sequence_changed', function(ev, data) {
						 service.getNearestSeating();
					 });

					 $rootScope.$on('ws:speakers_list_changed', function(ev, data) {
						 service.setSpeakersList(data.list);
					 });

					 $rootScope.$on('ws:check_unlock', function(ev, data) {

						 service.getNearestSeating();
					 });

					 wsService.registerUser();

				 });
			 },

			getNearestSeating: function () {
				restService.get('seatings/?today=true&comments=true').getList().then(function (data) { /* FL = 3, pågående = 4 */
					if (data.length >= 1) {
						console.log('seating found, lets get the data');
						service.getFullSeating(_.first(data.plain()).id);
					} else {
						//service.currentSeating = null;
						$rootScope.$broadcast('viewService:lockScreen');

					}
				});
			},

			 getFullSeating: function (seating) {

				 var defer = $q.defer();

				 if (!_.isObjectLike(seating)) {
					 restService.get('seatings').one(seating).get().then(function (data) {
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

					 if(data.type == '2') {
				 		return data;
					}

					data.allItems = _.map(data.items, 'id');
					data.items = _.filter(data.items, {'source': 'events'});

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

						service.getMinisters().then(function(data) {
							service.ministers = data;
							//service.enableAndDisableMinisters();
							$rootScope.$broadcast('viewService:setMinisters', service.ministers);
						});

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

						 if (service.currentSeating.type == 1) {
						 	console.log('Plenum');
						 	restService.get('speech_types').getList().then(function(speech_types_response) {
						 		service.setButtons(speech_types_response.plain());
							});
						 }

						 restService.post(
							 'system/speakers_list', { },
							 { 'X-CSRF-Token' : loginService.getToken() }

						 ).then(function(speakersList) {
							 service.setSpeakersList(speakersList.plain());
						 });

						if (service.user.isLedamot) {

							 if (service.currentSeating.type == 1) {

								service.user.mustCheckin = true;
								service.setMode('attendance', {
									 'attendance': 1,
									 'seating': service.currentSeating.id
								});

							 } else { /* TODO: BEHÖVS DETTA VERKLIGEN??? */

								 alert ('Hur hamnade jag här?');
								 /*
								 restService.get('votings/?open=1').getList().then(function (openVotings) {
									 var result = openVotings.plain();

									 if (result.length > 0) {
										 service.setMode('vote', result[0]);
									 } else {
										 service.setMode('');
									 }

								 });
								 */
							 }

						} else {
							service.user.mustCheckin = false;
							service.setMode('');
						}
					 });
				 });

			 },

			 setSpeakersList: function(data) {
			 	service.speakers = data;

			 	if (service.currentSeating.type == 1) {
					service.enableAndDisableButtons();
				}

				if (service.currentSeating.type == 2) {
					service.enableAndDisableMinisters();
				}


				$rootScope.$broadcast('viewService:setSpeakersList', service.speakers);
			 },

			 setButtons: function(buttons) {

			 	var validButtons = _.values(appConstants.SEATING_TYPES[0].buttons);

			 	service.buttons = _.filter(buttons, function(button) {
			 		return _.includes(validButtons, button.id);
				});

			 	service.enableAndDisableButtons();

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

				 service.ministers = _.map(service.ministers, function(button) {
					 button.active = button.id == questionsTarget;
					 button.disabled = !button.active && questionsTarget;
					 return button;
				 });
			 },

			 enableAndDisableButtons: function() {
				 var usersSpeeches = _.map(
					 _.filter(service.speakers, { 'person' : service.user.person.id}),
					 'type'
				 );

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


				 var eventIds = _.map(service.currentSeating.items, 'id'),
					 isInfo = !_.includes(eventIds, service.currentSeating.current_item);

				 /* Disable all buttons if info or if speaker has not begun yet */
				 if (
				 	isInfo
					 ||
					 (_.has(service, 'speakers[0].type') && service.speakers[0].status == '0')
				 ) {
				 	service.buttons = _.map(service.buttons, function(button) {
						 button.disabled = true;
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
				 console.log('viewService:mode_changed', service.mode);
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

		 };

		 return service;
	}

})();
