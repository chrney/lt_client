(function() {
	'use strict';

  angular
	.module('dj.generic').factory('dj.generic.service', djGenericServiceFn);

	djGenericServiceFn.$inject = [
		'$rootScope',
		'rest.service',
		'$q',
		'appConstants',
		'login.service',
		'generic.service',
	];

	 function djGenericServiceFn ($rootScope, restService, $q, appConstants, loginService, genericService) {

		 var service;
		 service = {

			 user: null,

			 currentSeating: null,
			 seatingIsActive: false,
			 viewingCase: null,
			 currentCase: null,

			 mode: {
				 'mode': '',
				 'data': {},
			 },

			 init: function () {
				 restService.get('seatings/?state=3,4').getList().then(function (data) { /* FL = 3, pågående = 4 */
					 var firstSeating = _.first(data.plain());
					 if (firstSeating) {
						 service.setSeating(firstSeating.id);
					 } else {
					 	alert('Inga kommande plenum hittades');
					 }
				 });
			 },

			 getSpeakersList: function () {
				 return restService.post('system/speakers_list', {}, {
					 'X-CSRF-Token': loginService.getToken(),
				 }).then(function (list) {
					 $rootScope.$broadcast('new_speakers_list', list);
				 });
			 },

			 setMode: function (mode, obj) {
				 this.mode = {
					 'mode': mode,
					 'data': obj
				 };
				 $rootScope.$broadcast('mode_changed', this.mode);
			 },

			 getMode: function () {
				 return this.mode;
			 },

			 seatingActive: function () {
				 return parseInt(this.currentSeating.state, 10) === 4;
			 },

			 setSeating: function (seating) {

				 var defer = $q.defer();
				 if (!_.isObjectLike(seating)) {
						restService.get('seatings').one(seating).get().then(function (data) {
						 defer.resolve(data.plain());
					 });
				 } else {
					 defer.resolve(seating);
				 }

				 defer.promise.then(function (seating) {
					 service.currentSeating = seating;

					 var getButtonsPromise;

					 if (seating.type == '1') {
						 getButtonsPromise = service.getSpeechButtons();
					 } else {
						 getButtonsPromise = service.getMinisters();
					 }

					 getButtonsPromise.then(function () {
						 $rootScope.$broadcast('dj.generic:setSeating', seating);

						 if (seating.attendance_check == 1) {
							 $rootScope.$broadcast('mode_changed', {
								 'mode': 'attendance',
								 'data': {
									 'attendance': 1,
									 'seating': seating.id
								 }
							 });
						 } else {
							 $rootScope.$broadcast('mode_changed', {
								 'mode': '',
							 });
						 }
					 });

				 });
			 },

			 getSeating: function () {
				 return this.currentSeating;
			 },

			 fullSeating: function (seating) {

				 var defer = $q.defer();

				 if (!_.isObjectLike(seating)) {
					 restService.get('seatings').one(seating).get().then(function (data) {
						 defer.resolve(data.plain());
					 });
				 } else {
					 defer.resolve(seating);
				 }

				 return defer.promise.then(function (data) {
					 //data.items = _.compact(data.items);
					 data.attendants = _.sortBy(data.attendants, 'name');
					 var events = _.filter(data.items, {'source': 'events'});

					 if (events) {
						 /* filter so we'll only get events */

						 var casesList = [], eventTypeList = [];
						 return restService.get('events/' + _.map(events, 'id').join(',') + '?as_array=true').getList().then(function (eventsResponse) {
							 eventsResponse = keysAsId(eventsResponse.plain());
							 data.items = _.map(data.items, function (item) {
								 if (item.source == 'events') {
									item = eventsResponse[item.id];
									item.source = 'events';
									 casesList.push(item.case);
									 eventTypeList.push(item.type);
								 }
								 return item;
							 });

							 return {
							 	'data' : data,
								'cases' : casesList,
								'types' : eventTypeList
							 };
						 }).then(function(obj) {

						 	var caseTypesList = [];

							 return restService.get('cases/' + obj.cases.join(',') + '?as_array=true').getList().then(function (casesResponse) {
								 casesResponse = keysAsId(casesResponse.plain());
								 obj.data.items = _.map(data.items, function (item) {
									 if (item.source == 'events') {
										 item.case = casesResponse[item.case];
										 caseTypesList.push(item.case.type);
									 }
									 return item;
								 });

								// if (caseTypes)

								 return obj;
							 });
						 }).then(function(obj) {

							 return restService.get('event_types/' + obj.types.join(',') + '?as_array=true').getList().then(function (eventTypesResponse) {
								 eventTypesResponse = keysAsId(eventTypesResponse.plain());
								 obj.data.items = _.map(data.items, function (item) {
									 if (item.source == 'events') {
										 item.type = eventTypesResponse[item.type];
									 }
									 return item;
								 });

								 return obj.data;
							 });
						 });
					 }

					 return data;

				 }).then(function(data) {

					 var infoblocks = _.filter(data.items, {'source': 'infos'});

					 if (infoblocks) {
						 return restService.get('infos/' + _.map(infoblocks, 'id').join(',') + '?as_array=true').getList().then(function (infoResponse) {
							 infoResponse = keysAsId(infoResponse.plain());
							 data.items = _.map(data.items, function (item) {
								 if (item.source == 'infos') {
									 item = infoResponse[item.id];
									 item.source = 'infos';
								 }
								 return item;
							 });

							 return data;
						 });
					 }

					 return data;

				 }).then(function(data) {
					 return restService.get('presence_states').getList().then(function(presenceStatesResponse) {
						 data.presenceStates = keysAsId(presenceStatesResponse.plain());
						 return data;
					 });

				 }).then(function(data) {

				 	return data;

				 });
			 },

			 fullCase: function(a) {
			 	console.log('here..........', a);
			 	return genericService.fullCase(a);
			 },

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
					 $rootScope.$broadcast('speechtypes_updated', that.speechButtons);
					 return that.speechButtons;
				 });
			 },



			 /* specific dj-functions, clean out from above if not really used within dj's admin-screen, as they might be obsolete when copying from client */

			 updateSeatingState: function(stateId) {

			 	var confirmed = true;

				 if (stateId == 5) {
				 	var confirmed = confirm("Vill du verkligen avsluta plenum?");
				 }

				 if (confirmed) {
					 var seatingClone = restService.self.one('seatings');
					 seatingClone = angular.extend(seatingClone, {id: this.currentSeating.id, state: stateId});

					 return seatingClone.put(null, {
						 'X-CSRF-Token': loginService.getToken()
					 }).then(
						 function (successResponse) {
							 console.log('saved');
							 //$state.go('seating', null, { reload: true  });
						 },
						 function (errorResponse) {
							 console.log("fail", errorResponse);
						 }
					 );
				 }

			 },

			 activateItem: function(item) {

				 var seatingClone = restService.self.one('seatings');
				 seatingClone = angular.extend(seatingClone, {
				 	'id': this.currentSeating.id,
					'current_item': item.id
				 });

				 return seatingClone.put(null, {
					 'X-CSRF-Token': loginService.getToken()
				 }).then(
					 function (successResponse) {
						 console.log('saved. Active now', item);
					 },
					 function (errorResponse) {
						 console.log("fail", errorResponse);
					 }
				 );
			 },

			 updateSeatingAttendanceCheck: function(attendanceCheckState) {

				 var seatingClone = restService.self.one('seatings');
				 seatingClone = angular.extend(seatingClone, {
					'id': this.currentSeating.id,
					'attendance_check': +attendanceCheckState + ""
				 });

				 return seatingClone.put(null, {
					 'X-CSRF-Token': loginService.getToken()
				 }).then(
					 function (successResponse) {
						 console.log('saved. State now', attendanceCheckState);
					 },
					 function (errorResponse) {
						 console.log("fail", errorResponse);
					 }
				 );
			 },

			 postToEndPoint: function(endpoint, obj) {
				 return restService.post(
					 endpoint,
					 obj,
					 { 'X-CSRF-Token' : loginService.getToken() }
				 ).then(function(response) {
					 return response;
				 });
			 },

			 getFromEndPoint : function(endpoint, singleObj) {
			 	if (singleObj) {
					return restService.get(endpoint).one().get();
				}
			 	return restService.get(endpoint).getList();
			 },

			// restService : restService,

			 wsSender: function(str, obj) {
				 genericService.wsSender(str, obj);
			 },

			 updateToEndPoint: function(endpoint, obj) {

				 var endpointClone = restService.self.one(endpoint);
				 endpointClone = angular.extend(endpointClone, obj);

				 return endpointClone.put(null, {
					 'X-CSRF-Token': loginService.getToken()
				 });
			 },


		 };

		return service;
	}

})();
