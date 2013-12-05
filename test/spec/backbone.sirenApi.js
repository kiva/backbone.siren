describe('sirenApi', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

	it('constructs a Siren instance', function () {
		var apiRoot = 'api.org';
		var sirenApi = new Backbone.Siren(apiRoot);

		expect(sirenApi instanceof Backbone.Siren).toBeTrue();
		expect(sirenApi.apiRoot).toBe(apiRoot);
	});


	describe('.resolve()', function () {
		var sirenApi;

		beforeEach(function () {
			sirenApi = new Backbone.Siren('api.org');
		});


		it('resolves the entityPath and returns jQuery promise', function () {
			var promise = (new $.Deferred()).promise();
			var stub = this.stub(Backbone.Siren, 'resolve').returns(promise);

			sirenApi.resolve('test');
			expect(stub).toHaveBeenCalledWith('api.org/test');
		});
	});

});