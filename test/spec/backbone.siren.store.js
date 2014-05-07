/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren.Store: ', function () {
	'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;


	describe('.addModel', function () {
		it('adds a model to the store', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenModel = new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]});

			store.addModel(bbSirenModel);

			expect(store.data['http://one']).toBeDefined();
		});


		it('returns the store object', function () {
			var store = new Backbone.Siren.Store()
			, bbSirenModel = new Backbone.Siren.Model({properties: {}, links: [{rel: ['self'], href: 'http://one'}]});

			expect(store.addModel(bbSirenModel)).toBe(store);
		});
	});


	describe('.addCollection()', function () {
		var store, rawSirenCollection;


		beforeEach(function () {
			store = new Backbone.Siren.Store();
			rawSirenCollection = {
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
				]
			};
		});


		it('adds a collection to the store, indexing by the rel provided', function () {
			rawSirenCollection.links.push({rel: ['current'], href: 'http://collect?page=30'});

			var bbSirenCollection = new Backbone.Siren.Collection(rawSirenCollection);

			expect(store.data['http://collect']).not.toBeDefined();
			expect(store.data['http://collect?page=30']).not.toBeDefined();

			store.addCollection(bbSirenCollection, 'self');
			store.addCollection(bbSirenCollection, 'current');

			expect(store.data['http://collect']).toBeDefined();
			expect(store.data['http://collect?page=30']).toBeDefined();
		});


		it('default rel is "self"', function () {
			var bbSirenCollection = new Backbone.Siren.Collection(rawSirenCollection);

			store.addCollection(bbSirenCollection);
			expect(store.data['http://collect']).toBeDefined();
		});


		it('returns the store object', function () {
			var bbSirenCollection = new Backbone.Siren.Collection(rawSirenCollection);
			expect(store.addCollection(bbSirenCollection)).toBe(store);
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
			store.addModel(model);
			expect(store.get(model.url())).toBeDefined();
		});


		it('gets a bbSiren object from the store that matches the given raw entity', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.get(model._data)).not.toBeDefined();
			store.addModel(model);
			expect(store.get(model._data)).toBeDefined();
		});


		it('gets a bbSiren object from the store that matches the given linked raw entity', function () {
			var rawModel = {href: "api.io/one"};
			var model = new Backbone.Siren.Model(rawModel);

			expect(store.get(rawModel)).not.toBeDefined();
			store.addModel(model);
			expect(store.get(rawModel)).toBeDefined();
		});

	});


	describe('.getCurrentCollection()', function () {
		var store, rawCurrentCollection, currentCollection;


		beforeEach(function () {
			store = new Backbone.Siren.Store();
			rawCurrentCollection = {'class': 'collection', links: [{rel: ['self'], href: 'http://x.io'}, {rel: ['current'], href: 'http://x.io?page=30'}]};
			currentCollection = new Backbone.Siren.Collection(rawCurrentCollection);
			store.addCollection(currentCollection, 'self');
			store.addCollection(currentCollection, 'current');
		});


		it('returns any matching, stored "current" collection for the given raw "loaded" collection', function () {
			var collection = store.getCurrentCollection(rawCurrentCollection);
			expect(collection).toBeDefined();
		});


		it('returns any matching, stored collection when given a raw "linked" collection', function () {
			var collection = store.getCurrentCollection({'class': 'collection', href: 'http://x.io'});
			expect(collection).toBeDefined();

			collection = store.getCurrentCollection({'class': 'collection', href: 'http://x.io?page=30'});
			expect(collection).toBeDefined();
		});


		it('returns undefined when given a raw "self" collection', function () {
			var collection = store.getCurrentCollection({'class': 'collection', links: [{rel: ['self'], href: 'http://x.io'}]});
			expect(collection).not.toBeDefined();
		});


		it('returns undefined if the "current" collection is not found', function () {
			var collection = store.getCurrentCollection({'class': 'collection', links: [{rel: ['self'], href: 'http://x.io'}, {rel: ['current'], href: 'http://x.io?page=45'}]});
			expect(collection).not.toBeDefined();
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
			store.addModel(model);
			expect(store.exists(model.url())).toBeTrue();
		});


		it('checks if a model already exists in the store', function () {
			var model = new Backbone.Siren.Model({links: [{rel: ['self'], href: "api.io/one"}]});

			expect(store.exists(model)).toBeFalse();
			store.addModel(model);
			expect(store.exists(model)).toBeTrue();
		});


		it('checks if a collection already exists in the store', function () {
			var collection = new Backbone.Siren.Collection({'class': ['collection'], links: [{rel: ['self'], href: "api.io/my-collection"}]});

			expect(store.exists(collection)).toBeFalse();
			store.addCollection(collection);
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

			// Accepts a regular expression
			result = store.filter(/notFound/);
			expect(result).toBeArray();
			expect(result.length).toBe(0);

			result = store.filter(/one/);
			expect(result.length).toBe(3);

			// Accepts a string
			result = store.filter('/one/two/three');
			expect(result.length).toBe(1);

			result = store.filter('four');
			expect(result.length).toBe(1);
		});
	});


	describe('.addRequest()', function () {
		it('adds a jqXhr request to the store', function () {
			var store = new Backbone.Siren.Store();
			var fakejqXhr = new $.Deferred();

			store.addRequest('http://someUrl', fakejqXhr);
			expect(store.requests['http://someUrl']).toBe(fakejqXhr);
		});


		it('removes the request from the store once its been resolved', function () {
			var store = new Backbone.Siren.Store();
			var fakejqXhr = new $.Deferred();

			store.addRequest('http://someUrl', fakejqXhr);
			fakejqXhr.resolve();
			expect(store.requests['http://someUrl']).toBeNull();
		});
	});


	describe('.getRequest()', function () {
		it('gets a jqXhr request from the store', function () {
			var store = new Backbone.Siren.Store();
			var fakejqXhr = new $.Deferred();

			store.addRequest('http://someUrl', fakejqXhr);
			expect(store.getRequest('http://someUrl')).toBe(fakejqXhr);
		});
	});
});
