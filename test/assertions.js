'use strict';

// Custom assertions
buster.assertions.add('toBePromise', {
	assert: function (obj) {
		return $.isFunction(obj.then);
	}
	, assertMessage: 'expected [${0}] to be a Promise object'
	, refuteMessage: 'expected [${0}] not to be a Promise object'
	, expectation: 'toBePromise'
});