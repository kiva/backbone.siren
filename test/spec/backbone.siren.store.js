/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

	describe('.filter', function () {

		it('filters down stored models by doing a regex match on all stored models', function () {
			var store = new Backbone.Siren.Store();

			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]}, {store: store});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one/two'}]}, {store: store});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one/two/three'}]}, {store: store});
			new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://four'}]}, {store: store});

			var result;

			result = store.filter(/notFound/);
			expect(result).toBeArray();
			expect(result.length).toBe(0);

			result = store.filter(/one/);
			expect(result.length).toBe(3);

			result = store.filter(/one\/two\/three/);
			expect(result.length).toBe(1);

			result = store.filter(/four/);
			expect(result.length).toBe(1);
		});
	});


});
