(function () {
	'use strict';

	angular
		.module('client.generic').factory('client.generic.service', clientGenericServiceFn);

	clientGenericServiceFn.$inject = [
		'$rootScope',
		'rest.service',
		'$q',
		'appConstants',
		'login.service',
		'generic.service',
		'ws.service',

	];

	function clientGenericServiceFn($rootScope, restService, $q, appConstants, loginService, genericService, wsService) {

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
					service.setSeating(firstSeating.id);
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

			isMinister: function () {
				return _.has(this.user, 'roles') && _.includes(this.user.roles, 'minister');
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
						var x = angular.copy(data.plain());
						data.items = _.filter(data.items, {'source': 'events'});
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
						$rootScope.$broadcast('client.generic:setSeating', seating);

						if (seating.attendance_check == 1) {

							service.setMode('attendance', {
								'attendance': 1,
								'seating': seating.id
							});

						//	$rootScope.$broadcast('mode_changed', {
						//		'mode': 'attendance',
						//		'data': {
						//			'attendance': 1,
						//			'seating': seating.id
						//		}
						//	});

						} else {

							restService.get('votings/?open=1').getList().then(function(openVotings) {

								var result = openVotings.plain();

								if (result.length > 0) {
									service.setMode('vote', result[0]);
								} else {
									service.setMode('');
								//	$rootScope.$broadcast('mode_changed', {
								//		'mode': '',
								//	});
								}

							});


						}
					});

				});
			},

			getSeating: function () {
				return this.currentSeating;
			},

			fullSeating: genericService.fullSeating,


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

		};

		return service;
	}

})();
