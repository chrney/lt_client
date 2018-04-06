(function() {
	'use strict';

	angular
		.module('generic')
			.run(runBlockFn);

	runBlockFn.$inject = [
		'ws.service',
		'$http',
		'$rootScope',
		'$cookies',
		'login.service',
		'generic.service',
		'$interval',
	];

	function runBlockFn(wsService, $http, $rootScope, $cookies, loginService, genericService, $interval) {

		genericService.init();

	    $rootScope.$on('ws:seating_state_changed', function(ev, data) {
			location.reload();

			if (data.state == 5) { /* seating closed */
				location.reload();
//				genericService.setSeating(data.id);
	    	}
	    });

		$rootScope.$on("ws:clientAuthenticated", function(ev, data) {
			genericService.user = data;
		});

	    $rootScope.$on('ws:attendance_check_changed', function(ev, data) {
	    	if (data.attendance == 1) { /* attendance_check activated */
	    		genericService.setMode('attendance', data);
	    		//$rootScope.$broadcast('attendance_check', data);
	    	} else {
	    		genericService.setMode(''); // speakers list
	    	}
	    });

//	    $rootScope.$on('ws:voting_state_changed', function(ev, data) {
//	    	if (data.state == 1) { /* vote activated */
//	    		genericService.setMode('vote', data);
//	    	} else {
//	    		console.log('voting: closed due to state', data.state);
//	    		genericService.setMode(''); // speakers list
//	    	}
//
//	    });


	    $rootScope.$on('case_updated', function(ev, data) {
	    	genericService.currentCase = data;
	    });

	}



})();
