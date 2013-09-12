describe('sirenApi', function () {
	'use strict';

	it('constructs a sirenApi instance', function () {
		var apiRoot = 'api.org';
		var options = {apiRoot: apiRoot};
		var sirenApi = new Backbone.SirenApi(options);

		expect(sirenApi instanceof Backbone.SirenApi).toBeTrue();
		expect(sirenApi.apiRoot).toBe(apiRoot);

		// We also support passing a string
		sirenApi = new Backbone.SirenApi(apiRoot);
		expect(sirenApi.apiRoot).toBe(apiRoot);
	});


	describe('.resolve()', function () {
		var sirenApi;

		beforeEach(function () {
			sirenApi = new Backbone.SirenApi();
		});


		it('throws if apiRoot is not set', function () {
			expect(function () {
				sirenApi.resolve('someEntity');
			}).toThrow();
		});


		it('throws if the entityPath is not set', function () {
			expect(function () {
				sirenApi.apiRoot = 'api.org';
				sirenApi.resolve();
			}).toThrow();
		});


		it('//resolves the entityPath and returns jQuery promise', function () {
			// @todo
		});
	});

});