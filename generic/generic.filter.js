(function() {
	'use strict';

	angular.module('generic')
		.filter('truncate', truncateFilterFn)
		.filter('responsible', responsibleFn)
		.filter('striphtml', striphtmlFn)
		.filter('inPercent', inPercentFn);

	inPercentFn.$inject = [ '$filter' ];

	function isOpenFilterFn() {
		return function(input, isOpen) {

			return (_.isUndefined(input) || isOpen == '0') ?
				input /* return all if nothing there or if 'open only' checkbox is not checked. */
				:
				_.filter(input, { closed: '0' }); /* 'open only' checkbox checked = return all items where item is not closed */
		};
	}

	function truncateFilterFn () {
        return function (text, length, end) {
        	length = (_.isNaN(length)) ? Number.POSITIVE_INFINITY : length;
            end = (_.isUndefined(end)) ? "…" : end;
            text = jQuery('<div>').html(text).text();
        	return _.truncate(text, {
  				'length': length,
				'omission': end
			});
        };
    }

	function striphtmlFn() {
		return function(text) {
			return text ? String(text).replace(/<[^>]+>/gm, '') : '';
		};
	};

    function responsibleFn () {

		var templates = [
			'-',
			'{name}',
			'{name} och {name} ',
			'{name}, {name} och {name}',
			'{name}, {name} och {n} andra'
		], idx;

        return function (names, length, end) {
        	idx = Math.min(names.length, 4);

        	names = _.map(names, function(name) {
        		if(name.source == 'persons') {
        			return '' + name.name + '';
        		} else {
					return '' + name.title + '';
				}
        	});

			return templates[idx].replace(/{name}|{n}/g, function (val) {
				return val === '{name}' ? names.shift() : names.length;
			});

        };

	}

	function inPercentFn($filter) {
		return function(value, total) {
			if(_.isArray(total)) {
				total = _.filter(total, function(obj) {
					return obj.vote !== null;
				}).length;
			}
			var value = value / total * 100 || 0;
			return $filter('number')(value, 2);
		}
	}


})();
