/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren.Store: ', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;


	describe('.add - Model', function () {

		it('adds a model to the store', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenModel = new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]});

			store.add(bbSirenModel);

			expect(store.data['http://one']).toBeDefined();
		});
	});


	describe('.add - Collection', function () {

		it('adds a collection to the store, which includes adding all sub-entities', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenCollection = new Backbone.Siren.Collection({
				'class': ['collection']
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


		it('adds a collection to the store, indexing by "current" if available', function () {
			var store = new Backbone.Siren.Store()
				, bbSirenCollection = new Backbone.Siren.Collection({
					'class': ['collection']
					, entities: [
						{properties: {}, links: [{rel: ['self'], href: 'http://one'}]}
						, {properties: {}, links: [{rel: ['self'], href: 'http://two'}]}
						, {properties: {}, links: [{rel: ['self'], href: 'http://three'}]}
					]
					, links: [
						{
							rel: ['self']
							, href: 'http://collect'
						}
						, {
							rel: ['current']
							, href: 'http://collect?page=30'
						}
					]
				});

			store.add(bbSirenCollection);
			expect(store.data['http://collect?page=30']).toBeDefined();
		});
	});


	describe('.get', function () {
		var store;

		beforeEach(function () {
			store = new Backbone.Siren.Store();
		});


		it('gets a bbSiren object with the given url from the store', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.get(model.url())).not.toBeDefined();
			store.add(model);
			expect(store.exists(model.url())).toBeDefined();
		});


		it('gets a bbSiren object matching the given raw entity from the store', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.get(model._data)).not.toBeDefined();
			store.add(model);
			expect(store.exists(model._data)).toBeDefined();
		});

	});


	describe('.exists', function () {
		var store;

		beforeEach(function () {
			store = new Backbone.Siren.Store();
		});
		

		it('checks if a bbSiren object with the given url already exists in the store', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.exists(model.url())).toBeFalse();
			store.add(model);
			expect(store.exists(model.url())).toBeTrue();
		});


		it('checks if a model already exists in the store', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.exists(model)).toBeFalse();
			store.add(model);
			expect(store.exists(model)).toBeTrue();
		});


		it('checks if a collection already exists in the store', function () {
			var collection = new Backbone.Siren.Collection({'class': ['collection'], links: [{rel: ['self'], href: "api.io/my-collection"}]});

			expect(store.exists(collection)).toBeFalse();
			store.add(collection);
			expect(store.exists(collection)).toBeTrue();
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
