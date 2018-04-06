(function() {
	'use strict';

  angular
	.module('generic').factory('generic.service', genericServiceFn);

	genericServiceFn.$inject = [
		'$rootScope',
		'rest.service',
		'$q',
		'appConstants',
		'login.service',
		'ws.service',
	];

	 function genericServiceFn ($rootScope, restService, $q, appConstants, loginService, wsService) {

		 var service;

		 service = {

			 init: function () {
			//	 console.log('generic.service init');
			 },

			 setMode: function (mode, obj) {

				 service.mode = {
					 'mode': mode,
					 'data': obj
				 };
				 console.error('mode set to ', service.mode);
				 $rootScope.$broadcast('mode_changed', service.mode);
			 },

			 fullSeating: function (seating, keepInfoBlocks) {

				 var defer = $q.defer();

				 if (!_.isObjectLike(seating)) {
					 restService.get('seatings').one(seating).get().then(function (data) {
						 defer.resolve(data.plain());
					 });
				 } else {
					 defer.resolve(seating);
				 }

				 return defer.promise.then(function (data) {



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

					 var agregateLists = {};

					 _.each(['cases', 'event_types'], function (subNode) { /* prepare empty lists of stuff to be filled with id's */
						 agregateLists[subNode] = [];
					 });

					 _.each(data.items, function (v) {
						 //agregateLists.persons = _.concat(agregateLists.persons, _.map(_.filter(v.responsible, { 'source' : 'persons'}), 'id'));
						 //agregateLists.organizations = _.concat(agregateLists.organizations, _.map(_.filter(v.responsible, { 'source' : 'organizations'}), 'id'));
						 agregateLists.event_types.push(v.type);
						 agregateLists.cases.push(v.case);
					 });


					 return {
						 'agregateLists': agregateLists,
						 'seating': data,
					 }

				 }).then(function (obj) {
					 var dataPromisesResult = [],
						 dataPromises = {};

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

						 obj.seating.items = _.each(obj.seating.items, function (item, k) {

							 item.case = dataPromisesResult.cases[item.case];
							 item.type = dataPromisesResult.event_types[item.type];
							 item.headline = item.type.title;
						 });

						 return obj.seating;

					 });
				 });
			 },

			 fullCase: function (caseObj) {
				 var defer = $q.defer();

				 if (!_.isObjectLike(caseObj)) {
					 restService.get('cases').one(caseObj).get().then(function (data) {
						 defer.resolve(data.plain());
					 });
				 } else {
					 defer.resolve(caseObj);
				 }
				 ;

				 return defer.promise.then(function (data) { /* get case type */

					 restService.get('case_types').one(data.type).get().then(function (caseType) {
						 data.type = caseType.plain();
					 });
					 return data;

				 }).then(function (data) { /* get theme */

					 restService.get('themes').one(data.theme).get().then(function (theme) {
						 data.theme = theme.plain();
					 });
					 return data;

				 }).then(function (data) { /* get phases */

					 restService.get('phases').getList().then(function (phases) {
						 phases = keysAsId(phases.plain());
						 data.phases = _.map(data.phases, function (phase) {
							 return {
								 'phase': phases[phase.id],
								 'state': phase.state
							 }
						 });
					 });
					 return data;

				 }).then(function (data) { /* get laws */

					 /*
					 restService.external('laws', 'http://stage.regeringen.ax/services_law/updated_law?type=ll').getList().then(function(laws) {
					  laws = _.keyBy(laws.plain(), 'node_id');
					  data.related_laws = _.map(data.related_laws, function(law) {
					  return laws[law];
					  });
					  });
					  */
					 return data;

				 }).then(function (data) { /* get events */
					 return restService.get('cases/' + data.id + '/events').getList().then(function (eventList) {
						 data.items = _.reverse(eventList.plain());

						 return data;
					 });
				 }).then(function (data) { /* get event details */

					 return restService.get('events/' + _.map(data.items, 'id').join(',') + '?as_array=true').getList().then(function (events) {
						 events = _.keyBy(events.plain(), 'id');
						 data.items = _.map(data.items, function (item) {
							 item.toggled = false;
							 item = events[item.id];
							 return item;
						 });

						 return data;
					 })

				 }).then(function (data) { /* get event types */
					 var eventTypeIds = _.map(data.items, 'type');

					 return restService.get('event_types/' + eventTypeIds.join(',') + '?as_array=true').getList().then(function (eventTypes) {
						 eventTypes = _.keyBy(eventTypes.plain(), 'id');
						 data.items = _.map(data.items, function (item) {
							 item.date = moment(item.date).format('YYYY-MM-DD');
							 item.type = eventTypes[item.type];
							 return item;
						 });

						 return data;
					 });

				 }).then(function (data) { /* get event's documents */
					 var documentIds = Array();

					 _.each(data.items, function (item) {
						 documentIds = _.concat(documentIds, item.document);
					 });

					 return restService.get('documents/' + documentIds.join(',') + '?as_array=true').getList().then(function (documents) {
						 documents = _.keyBy(documents.plain(), 'id');
						 _.each(data.items, function (item) {
							 item.document = _.map(item.document, function (document) {
								 return documents[document];
							 });
						 });

						 return data;
					 });

				 }).then(function (data) { /* get speech's persons */

					 var personIds = Array(),
						 speechTypeIds = Array(),
						 sequenceFound = false;

					 _.each(data.items, function (event) {
						 if (event.sequence) {
							 sequenceFound = true;

							 var speeches = _.filter(event.sequence, {'source': 'speeches'});

							 personIds = _.concat(personIds, _.map(speeches, 'person'));
							 speechTypeIds = _.concat(speechTypeIds, _.map(speeches, 'type'));
						 }
					 });

					 if (!sequenceFound) {
						 return data;
					 }


					 var voteStates = _.keyBy(appConstants.VOTE_STATES, 'id');


					 return restService.get('persons/' + personIds.join(',') + '?as_array=true').getList().then(function (persons) {
						 persons = _.keyBy(persons.plain(), 'id');

						 _.each(data.items, function (event) {
							 if (sequenceFound) {
								 event.sequence = _.map(event.sequence, function (item) {

									 if (item.source === 'speeches') {
										 item.person = persons[item.person];
									 }

									 if (item.source === 'votings') {
										 var voteResults = _.groupBy(item.votes, 'vote'),
											 totalVotes = 0;

										 item.votes = _.map(voteStates, function (v, k) {
											 v.count = _.isArray(voteResults[k]) ? voteResults[k].length : 0;
											 totalVotes += v.count;
											 return v;
										 });

										 item.votes.push({
											 color: "#ECE",
											 count: 30 - totalVotes,
											 title: "Ej röstad",
										 });

									 }

									 return item;
								 });
							 }
						 });

						 return data;

					 }).then(function (data) {

						 return restService.get('speech_types/' + speechTypeIds.join(',') + '?as_array=true').getList().then(function (speechTypes) {
							 speechTypes = _.keyBy(speechTypes.plain(), 'id');

							 _.each(data.items, function (event) {
								 if (event.sequence) {
									 event.sequence = _.map(event.sequence, function (item) {

										 if (item.source === 'speeches') {
											 item.type = speechTypes[item.type];
										 }

										 return item;
									 });
								 }
							 });

							 return data;
						 });

					 });
				 });
			 },

			 getMinisters: function () {

				 return restService.get('persons').getList().then(function (persons) {
					 var filterByDate = moment();
					 return _.filter(persons.plain(), function (person) {
						 return !_.isEmpty(_.filter(person.bindings, function (binding) {
							 return (
								 filterByDate.isBetween(moment(binding.period_start), moment(binding.period_end)) /* within set date */
								 && binding.organization == appConstants.GOVERNMENT.organization
								 && _.includes(appConstants.GOVERNMENT.roles, binding.role) /* some kind of minister or lantråd */
							 );
						 }));
					 });
				 });
			 },

			 getSpeechButtons: function () {
				 return restService.get('speech_types/').getList().then(function (speechTypes) {
					 return _.filter(speechTypes.plain(), {
					 	'button_visible': '1'
					 });
				 });
			 },

			 wsSender: function(str, obj) {
				 wsService.custom(str, obj);
			 }

		 };



		return service;
	}

})();
