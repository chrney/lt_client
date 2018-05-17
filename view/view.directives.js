angular
	.module('view')
	.directive('dynamicCtrl', dynamicCtrlFn);

dynamicCtrlFn.$inject = [
	'$compile',
	'$parse',
	'rest.service',
	'view.service'
];

function dynamicCtrlFn($compile, $parse, restService, viewService) {
	return {
		restrict: 'A',
		terminal: true,
		priority: 10000,
		link: function(scope, elem) {

			restService.internal('', 'get_user_roles').get().then(function(response) {

				response = response.plain();
				var mainRole = 'tv',
					isGovernor = false;

				if (_.has(response, '7')) { /* role talman */
					mainRole = 'speaker';
				} else if (_.has(response, '4') || _.has(response, '8')) { /* role ledamot or minister */
					mainRole = 'client';
				}

				if (window.location.href.indexOf('isGovernor') !== -1) {/* fake Landshövding */
					mainRole = 'client';
					isGovernor = true;
				}

				elem.removeAttr('dynamic-ctrl');
				elem.attr('ng-controller', 'view.' + mainRole + '.controller as vm');
				elem.attr('ng-include', "'/view/templates/" + mainRole + ".tpl.html'");

				if (mainRole !== 'client') {
					document.querySelector('body').className += ' ' + mainRole;
				}

				if (mainRole === 'tv') { /* tv - no header */
					var header = document.getElementById('header');
					header.parentNode.removeChild(header);
				}

				$compile(elem)(scope);

				console.info('Running as ', mainRole);
				viewService.init(mainRole, isGovernor);


			});

		}
	};
}
