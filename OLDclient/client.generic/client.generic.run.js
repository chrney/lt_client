(function() {
	'use strict';

	angular
		.module('client.generic')
			.run(runBlockFn);

	runBlockFn.$inject = [
		'ws.service',
		'$http',
		'$rootScope',
		'$cookies',
		'login.service',
		'client.generic.service',
		'$interval',
	];

	function runBlockFn(wsService, $http, $rootScope, $cookies, loginService, clientGenericService, $interval) {

		loginService.init().then(function() {

			wsService.registerUser();

		}).then(function() {

			clientGenericService.init();

		});

	    $rootScope.$on('ws:seating_state_changed', function(ev, data) {
	    	if (data.state == 4) { /* seating activated */
				clientGenericService.setSeating(data.id);
	    	} else {
	    		console.log('seating has changed, state', data);
			}
	    });

		$rootScope.$on("ws:clientAuthenticated", function(ev, data) {
			clientGenericService.user = data;
		});

	    $rootScope.$on('ws:attendance_check_changed', function(ev, data) {
	    	if (data.attendance == 1) { /* attendance_check activated */
	    		clientGenericService.setMode('attendance', data);
	    	} else {
	    		clientGenericService.setMode(''); // speakers list
	    	}
	    });

	    $rootScope.$on('ws:voting_state_changed', function(ev, data) {
	    	if (data.state == 1) { /* attendance_check activated */
	    		clientGenericService.setMode('vote', data);
	    	} else {
	    		clientGenericService.setMode(''); // speakers list
	    	}

	    });

	    $rootScope.$on('case_updated', function(ev, data) {
	    	clientGenericService.currentCase = data;
	    });

	}



})();
