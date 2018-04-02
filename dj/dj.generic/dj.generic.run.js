(function() {
	'use strict';

	angular
		.module('dj.generic')
			.run(runBlockFn);

	runBlockFn.$inject = [
		'ws.service',
		'$http',
		'$rootScope',
		'$cookies',
		'login.service',
		'dj.generic.service',
		'$interval',
	];

	function runBlockFn(wsService, $http, $rootScope, $cookies, loginService, djGenericService, $interval) {

		loginService.init().then(function() {

			wsService.registerUser();

		}).then(function() {

			djGenericService.init();

		});

	    $rootScope.$on('ws:seating_state_changed', function(ev, data) {
	    	if (data.state == 4) { /* seating activated */
				djGenericService.setSeating(data.id);
	    	} else {
	    		console.log('dj.seating changed', data);
			}
	    });

		$rootScope.$on("ws:clientAuthenticated", function(ev, data) {
			djGenericService.user = data;
		});

	    $rootScope.$on('ws:attendance_check_changed', function(ev, data) {
	    	if (data.attendance == 1) { /* attendance_check activated */
	    		djGenericService.setMode('attendance', data);
	    	} else {
	    		djGenericService.setMode(''); // speakers list
	    	}
	    });

	    $rootScope.$on('ws:voting_state_changed', function(ev, data) {
	    	if (data.state == 1) { /* attendance_check activated */
	    		djGenericService.setMode('vote', data);
	    	} else {
	    		djGenericService.setMode(''); // speakers list
	    	}

	    });

	    $rootScope.$on('case_updated', function(ev, data) {
	    	djGenericService.currentCase = data;
	    });

	}



})();
