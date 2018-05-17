(function() {
	'use strict';

  angular
	.module('ws').factory('ws.service', wsServicefn);

	wsServicefn.$inject = [
		'$http',
		'$rootScope',
		'login.service',
		'$interval',
	];

	 function wsServicefn ($http, $rootScope, loginService, $interval) {

		var service =  {

			user: {},

			connected: null,

			withCredentials: true,

			init: function() {
				service.socket = io.connect('https://ws.lagtinget.ax:8080', {
							'reconnection': true,
							'reconnectionDelay': 500,
							'reconnectionAttempts': 100
						});

				service.getToken().then(function(x) {
					service.sendAuth(x.data[0]);
				});

			},

			registerUser : function() {
				var user = loginService.currentUser;
				service.user = _.isObject(user) ? user : { 'uid' : 0 };
				service.token = loginService.getToken();
				service.connect();
			},

			getToken: function() {
				return $http.post('https://api.lagtinget.ax/api/system/session.json', {}, {
					'headers': {
						'X-CSRF-Token' : service.token,
					},
					'withCredentials': service.withCredentials
				});
			},

			sendAuth: function(token) {
				service.token = token;

				service.socket.emit('authenticate', {
					authToken: token,
					contentTokens: null
				});

				service.connect();

			},

			custom: function(str, obj) {
				service.socket.emit(str, obj);
			},

			ping: function() {
				/*
				$interval(function () {
					service.socket.emit('message', {
						'action': 'ping',
						'user': service.user.uid
					});
				}, 2 * 1000);
				*/
			},

			connect: function(room) {

				if (!service.socket) {
					service.init();
				} else {

					service.socket.on('disconnect', function () {
						service.connected = false;
						location.reload();
					});

					service.ping();
					service.connected = true;

					//service.socket.on('connect', function (a) {

						/* EXAMPLE TO SEND TO SERVER */
						/*
						if (room) {
							service.socket.emit('message', {
								'type' : 'server-message',
								'action' : 'add-channel',
								'authToken' : service.token,
								'add-channel' : room
							});
						}
						*/
					//});

					service.socket.on('message', function (msg) {
						console.log('ws:' + msg.callback, msg.data);
						$rootScope.$broadcast('ws:' + msg.callback, msg.data);
					});

					service.socket.connect();

				}
			}

		}

		return service;
	}

})();
