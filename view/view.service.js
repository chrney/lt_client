
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

	];

	 function viewServiceFn (loginService, wsService, $rootScope, restService, $q) {

		 var service;

		 service = {

			 init: function () {
				 loginService.init().then(function () {

					 $rootScope.$on('ws:seating_state_changed', function (ev, data) {
						 if (data.state == 4) { /* seating activated */
							 service.setSeating(data.id);
						 } else {
							 console.log('seating has changed, state', data);
						 }
					 });

					 $rootScope.$on("ws:clientAuthenticated", function (ev, data) {
						 service.user = data;

						var roles = _.values(service.user.roles);
						 _.each(['ledamot', 'minister', 'talman'], function(str) {
							 service.user['is' + _.startCase(_.toLower(str))] = _.includes(roles, str);
						 });

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


					 wsService.registerUser();

				 });
			 },

			 getNearestSeating: function () {
				 restService.get('seatings/?state=3,4').getList().then(function (data) { /* FL = 3, pågående = 4 */
					 service.getFullSeating(_.first(data.plain()).id);
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

						 if (service.user.isLedamot) {

							 if (service.currentSeating.type == 1) {

							 	console.error('Init, plenum, isLedamot');
								service.user.mustCheckin = true;
								service.setMode('attendance', {
									 'attendance': 1,
									 'seating': service.currentSeating.id
								});

							 } else {

								 restService.get('votings/?open=1').getList().then(function (openVotings) {
									 var result = openVotings.plain();

									 if (result.length > 0) {
										 service.setMode('vote', result[0]);
									 } else {
										 service.setMode('');
									 }

								 });
							 }

						 } else {
							 service.user.mustCheckin = false;
							 service.setMode('');
						 }
					 });
				 });
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

		 };

			 /*

			 		 getMinisters: function () {


							  var that = this;

							  return genericService.getMinisters().then(function (ministers) {

								  that.ministers = _.map(ministers, function (minister) {
									  var btn = _.clone(minister);
									  btn.id = 225;
									  btn.title = minister.name;
									  btn.icon = 'fa fa-comment';
									  btn.target = minister.id;
									  return btn;
								  });

								  $rootScope.$broadcast('ministers_updated', that.ministers);
								  return that.ministers;
							  });

						  },

						  getSpeechButtons: function () {
							  var that = this;
							  return genericService.getSpeechButtons().then(function (speechButtons) {
								  that.speechButtons = speechButtons;
								  $rootScope.$broaspeechtypes_updated', that.speechButtons);
								  return that.speechButtons;
							  });
						  },


					  var getButtonsPromise;

					  if (seating.type == '1') {
						  getButtonsPromise = service.getSpeechButtons();
					  } else {
						  getButtonsPromise = service.getMinisters();
					  }
			 */









		 return service;
	}

})();
