/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren.Store: ', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;


	describe('.add - Model', function () {

		it('adds a model to the store', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenModel = new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]})

			store.add(bbSirenModel);

			expect(store.data['http://one']).toBeDefined();
		});
	});


	describe('.add - Collection', function () {

		it('adds a collection to the store', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenCollection = new Backbone.Siren.Collection({
				class: ['collection']
				, entities: [
					{properties: {}, links: [{rel: ['self'], href: 'http://one'}]}
					, {properties: {}, links: [{rel: ['self'], href: 'http://two'}]}
					, {properties: {}, links: [{rel: ['self'], href: 'http://three'}]}
				]
				, rel: ['self']
				, href: 'http://collect'
			});

			store.add(bbSirenCollection);

			expect(store.data['http://collect']).toBeDefined();
			expect(store.data['http://one']).toBeDefined();
			expect(store.data['http://two']).toBeDefined();
			expect(store.data['http://three']).toBeDefined();
		});
	});


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
