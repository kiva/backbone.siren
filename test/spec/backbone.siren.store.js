/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

	describe('.filter', function () {

		it('filters down stored models by doing a regex match on all stored models', function () {
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one/two'}]});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one/two/three'}]});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://four'}]});

			var result;

			result = Backbone.Siren.store.filter(/notFound/);
			expect(result).toBeArray();
			expect(result.length).toBe(0);

			result = Backbone.Siren.store.filter(/one/);
			expect(result.length).toBe(3);

			result = Backbone.Siren.store.filter(/one\/two\/three/);
			expect(result.length).toBe(1);

			result = Backbone.Siren.store.filter(/four/);
			expect(result.length).toBe(1);
		});
	});


});
