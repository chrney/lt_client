(function() {
	'use strict';

  angular
	.module('client.helper').factory('helper.service', helperServicefn);

	helperServicefn.$inject = [
		'$rootScope',
	];

	 function helperServicefn ($rootScope) {

		var service =  {

			sidebarVisible : true,

			mainCol : 9,

			getSidebar : function() {
				return service.sidebarVisible;
			},

			setSidebar : function(v) {
				service.sidebarVisible = v;
				service.mainCol = service.sidebarVisible ? 9 : 12;

				$rootScope.$broadcast('sidebar');

			}

		}

		return service;
	}

})();
