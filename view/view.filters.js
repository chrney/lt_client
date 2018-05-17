angular.module('view')
	.filter('secondsToDateTime', secondsToDateTimeFn);

function secondsToDateTimeFn() {
	return function(seconds) {
		return new Date(1970, 0, 1).setSeconds(Math.abs(seconds));
	}
};

