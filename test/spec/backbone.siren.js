/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;


    var rawSettingsModel, rawCollection, rawCurrentCollection, rawCurrentCollection2;


	beforeEach(function () {
		rawSettingsModel = {
			"class":["order", "special"]
			,"properties":{"orderNumber":42,"itemCount":3,"status":"pending"}
			,"entities":[
				{"class":["items","collection"],"rel":["http://x.io/rels/order-items", "name:order-items"],"href":"http://api.x.io/orders/42/items"}
				,{"class":["info","customer"],"rel":["http://x.io/rels/customer", "name:customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}
			]
			,"actions":[
				{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{name: "addedLater"}, {"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}]
			,"links":[
				{"rel":["self"],"href":"http://api.x.io/orders/42"}
				,{"rel":["previous"],"href":"http://api.x.io/orders/41"}
				,{"rel":["next"],"href":"http://api.x.io/orders/43"}
			]
		};

		rawCollection = {
			"class": ["collection"]
			, "entities": [
				{
					"links": [
						{"rel": ["self"], "href":"http://api.x.io/orders/41"}
					]
				}
				, {
					"links": [
						{"rel": ["self"],  "href":"http://api.x.io/orders/42"}
					]
				}
			]
			, links: [
				{"rel": ["self"], "href":"http://api.x.io/orders"}
			]
		};


		rawCurrentCollection = {
			entities: [
				{
					"links": [
						{"rel": ["self"], "href":"http://api.x.io/orders/43"}
					]
				}
				, {
					"links": [
						{"rel": ["self"],  "href":"http://api.x.io/orders/44"}
					]
				}
			]
			, links: [
				{rel: ['self'], href: 'http://api.x.io/orders'}
				, {rel: ['current'], href: 'http://api.x.io/orders?page=30'}
			]
		};


		rawCurrentCollection2 = {
			entities: [
				{
					"links": [
						{"rel": ["self"], "href":"http://api.x.io/orders/45"}
					]
				}
				, {
					"links": [
						{"rel": ["self"],  "href":"http://api.x.io/orders/46"}
					]
				}
			]
			, links: [
				{rel: ['self'], href: 'http://api.x.io/orders'}
				, {rel: ['current'], href: 'http://api.x.io/orders?page=31'}
			]
		};
	});


	describe('.isHydratedObject', function () {

		it('checks if an object is an instantiated Backbone.Siren object', function () {
			var bbSirenModel = new Backbone.Siren.Model(rawSettingsModel);

			expect(Backbone.Siren.isHydratedObject(rawSettingsModel)).toBeFalse();
			expect(Backbone.Siren.isHydratedObject(bbSirenModel)).toBeTrue();

			var bbSirenCollection = new Backbone.Siren.Collection(rawCollection);

			expect(Backbone.Siren.isHydratedObject(rawCollection)).toBeFalse();
			expect(Backbone.Siren.isHydratedObject(bbSirenCollection)).toBeTrue();
		});


		it('returns false if no arguments is provided', function () {
			expect(Backbone.Siren.isHydratedObject()).toBeFalse();
		});
	});


	describe('.isLoaded', function () {

		it('it tells us if a raw entity is fully loaded or if it is a partial representation', function () {
			var fullyLoadedEntity = {
				links: []
			}
			, partialEntity = {
				href: ''
			};

			expect(Backbone.Siren.isLoaded(partialEntity)).toBeFalse();
			expect(Backbone.Siren.isLoaded(fullyLoadedEntity)).toBeTrue();
		});
	});


	describe('.isCollection', function () {

		it('checks if a backbone.siren object is a collection', function () {
			var bbSirenModel = new Backbone.Siren.Model(rawSettingsModel);
			var bbSirenCollection = new Backbone.Siren.Collection(rawCollection);

			expect(Backbone.Siren.isCollection(rawSettingsModel)).toBeFalse();
			expect(Backbone.Siren.isCollection(rawCollection)).toBeFalse();
			expect(Backbone.Siren.isCollection(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isCollection(bbSirenCollection)).toBeTrue();
		});
	});


	describe('.isRawCollection', function () {
		it('checks if a siren json object is a collection', function () {
			var bbSirenModel = new Backbone.Siren.Model(rawSettingsModel);
			var bbSirenCollection = new Backbone.Siren.Collection(rawCollection);

			expect(Backbone.Siren.isRawCollection(rawSettingsModel)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(bbSirenCollection)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(rawCollection)).toBeTrue();
		});
	});


	describe('.isRawError()', function () {
		it('checks if a raw siren object is an error', function () {
			var bbSirenModel = new Backbone.Siren.Model(rawSettingsModel);

			expect(Backbone.Siren.isRawError(rawSettingsModel)).toBeFalse();
			expect(Backbone.Siren.isRawError(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isRawError({'class': ['error']})).toBeTrue();
		});
	});


	describe('.addModelToStore()', function () {
		it('adds a model to the store', function () {
			var model = new Backbone.Siren.Collection(rawSettingsModel);
			var store = new Backbone.Siren.Store();

			Backbone.Siren.addModelToStore(store, model);
			expect(store.get(model.url())).toBeDefined();
		});
	});


	describe('.addCollectionToStore()', function () {
		it('adds a collection to the store', function () {
			var collection = new Backbone.Siren.Collection(rawCollection);
			var store = new Backbone.Siren.Store();

			Backbone.Siren.addCollectionToStore(store, collection);
			expect(store.get(collection.url())).toBeDefined();
		});


		it('adds current collections to the store, as well as the self collection', function () {
			var currentCollection = new Backbone.Siren.Collection(rawCurrentCollection);
			var store = new Backbone.Siren.Store();

			Backbone.Siren.addCollectionToStore(store, currentCollection);
			expect(store.get(currentCollection.link('self'))).toBeDefined();
			expect(store.get(currentCollection.link('current'))).toBeDefined();
		});


		it('only adds the self collection to the store if `representationToStore` is set to `self`', function () {
			var currentCollection = new Backbone.Siren.Collection(rawCurrentCollection);
			var store = new Backbone.Siren.Store();

			Backbone.Siren.addCollectionToStore(store, currentCollection, 'self');
			expect(store.get(currentCollection.link('self'))).toBeDefined();
			expect(store.get(currentCollection.link('current'))).not.toBeDefined();
		});


		it('only adds the current collection to the store if `representationToStore` is set to `collection`', function () {
			var currentCollection = new Backbone.Siren.Collection(rawCurrentCollection);
			var store = new Backbone.Siren.Store();

			Backbone.Siren.addCollectionToStore(store, currentCollection, 'current');
			expect(store.get(currentCollection.link('current'))).toBeDefined();
			expect(store.get(currentCollection.link('self'))).not.toBeDefined();
		});
	});


	describe('.serializeData()', function () {
		it('returns a serialized version of the model or collection', function () {
			this.spy(Backbone.Siren.Model.prototype, 'toJSON');
			this.spy(Backbone.Siren.Collection.prototype, 'toJSON');

			var settingsModel = new Backbone.Siren.Model(rawSettingsModel);
			Backbone.Siren.serializeData(settingsModel);
			expect(settingsModel.toJSON).toHaveBeenCalled();

			var collection = new Backbone.Siren.Collection(rawCollection);
			Backbone.Siren.serializeData(collection);
			expect(collection.toJSON).toHaveBeenCalled();
		});


		it('returns the value if it\'s not a Model or Collection', function () {
			expect(Backbone.Siren.serializeData('two')).toBe('two');
		});


		it('returns `undefined` if val\'s already been rendered', function () {
			var settingsModel = new Backbone.Siren.Model(rawSettingsModel);
			expect(Backbone.Siren.serializeData(settingsModel, {renderedEntities: [settingsModel.url()]})).not.toBeDefined();
		});
	});


	describe('.parseModel()', function () {
		it('creates a new Backbone.Siren.Model from a raw model', function () {
			var model = Backbone.Siren.parseModel(rawSettingsModel);
			expect(model instanceof Backbone.Siren.Model).toBeTrue();
		});


		it('updates an existing model if it is already cached', function () {
			var store = new Backbone.Siren.Store();
			var model1 = Backbone.Siren.parseModel(rawSettingsModel, {store: store});

			rawSettingsModel.properties.itemCount = 5;
			var model2 = Backbone.Siren.parseModel(rawSettingsModel, {store: store});

			expect(model1.get('itemCount')).toBe(5);
			expect(model1.cid).toBe(model2.cid);
		});
	});


	describe('.parseCollection()', function () {
		it('creates a new collection from a raw collection', function () {
			var collection = Backbone.Siren.parseCollection(rawCurrentCollection);
			expect(collection instanceof Backbone.Siren.Collection).toBeTrue();
		});


		it('updates an existing collection if it is already cached', function () {
			var store = new Backbone.Siren.Store();
			var initialCollection = new Backbone.Siren.Collection(rawCollection, {store: store});
			var initialStoredCollection = store.get(initialCollection.url());

			var updatedCollection = Backbone.Siren.parseCollection(rawCollection, {store: store});
			var updatedStoredCollection = store.get(updatedCollection.url());

			// Check what's in the store
			expect(updatedStoredCollection).toBe(initialStoredCollection);

			// Check the returned collection
			expect(updatedCollection).toBe(initialCollection);
		});


		it('updates the "self" and "current" collections if they are both in the cache', function () {
			var store, collection, initialStoredSelfCollection, updatedStoredSelfCollection
			, initialStoredCurrentCollection, updatedStoredCurrentCollection;

			store = new Backbone.Siren.Store();

			// Create a current collection and a self collection
			collection = new Backbone.Siren.Collection(rawCurrentCollection, {store: store});

			initialStoredSelfCollection = store.get(getRawEntityUrl(rawCurrentCollection, 'self'));
			initialStoredCurrentCollection = store.get(getRawEntityUrl(rawCurrentCollection, 'current'));

			Backbone.Siren.parseCollection(rawCurrentCollection);

			updatedStoredSelfCollection = store.get(getRawEntityUrl(rawCurrentCollection, 'self'));
			updatedStoredCurrentCollection = store.get(getRawEntityUrl(rawCurrentCollection, 'current'));

			expect(updatedStoredSelfCollection).toBe(initialStoredSelfCollection);
			expect(updatedStoredCurrentCollection).toBe(initialStoredCurrentCollection);
		});


		it('adds the "current" collection and the "self" collection to the store', function () {
			var store = new Backbone.Siren.Store();

			Backbone.Siren.parseCollection(rawCurrentCollection, {store: store});

			var cachedCurrentCollection = store.data['http://api.x.io/orders?page=30'];
			expect(cachedCurrentCollection).toBeDefined();

			var cachedSelfCollection = store.data['http://api.x.io/orders'];
			expect(cachedSelfCollection).toBeDefined();
		});


		it('adds the "current" collection to the store and updates the cached "self" collection', function () {
			var store = new Backbone.Siren.Store();

			// Add first collection to the store
			Backbone.Siren.parseCollection(rawCurrentCollection, {store: store});

			// Add a new collection
			Backbone.Siren.parseCollection(rawCurrentCollection2, {store: store});

			// It should have been cached
			var cachedCurrentCollection = store.data['http://api.x.io/orders?page=31'];
			expect(cachedCurrentCollection).toBeDefined();

			// The "self" collection should have been added to
			var cachedSelfCollection = store.data['http://api.x.io/orders'];
			expect(cachedSelfCollection.size()).toBe(4);
		});


		it('creates a new "self" collection if parsing a "current" collection and one does not already exist', function () {
			var store = new Backbone.Siren.Store();

			// Add a current collection to the store
			var collection = Backbone.Siren.parseCollection(rawCurrentCollection, {store: store});
			var storedCurrentCollection = store.get(collection.link('current'));
			var storedSelfCollection = store.get(collection.link('self'));

			expect(storedCurrentCollection).toBe(collection);
			expect(storedCurrentCollection).not.toBe(storedSelfCollection);
		});


		it('leaves the matching, cached, "loaded" collection un-changed if parsing a "linked" collection', function () {
			var store = new Backbone.Siren.Store();
			var collection = new Backbone.Siren.Collection(rawCollection, {store: store});

			collection = Backbone.Siren.parseCollection({'class': ['collection'], href: 'http://api.x.io/orders'}, {store: store});
			expect(collection.size()).toBe(2);

			// Now check what we have in the store
			collection = store.get(collection.url());
			expect(collection.size()).toBe(2);
		});


		it('uses existing models from the store instead of creating new ones', function () {
			var store = new Backbone.Siren.Store();
			var collection = new Backbone.Siren.Collection(rawCollection, {store: store});

			// Parse the same raw collection again...
			collection = Backbone.Siren.parseCollection(rawCollection, {store: store});

			collection = store.get(collection.url());
			expect(collection.size()).toBe(2);
		});
	});


    describe('.parse', function () {
	    it('parses a raw Collection', function () {
		    var bbSiren = Backbone.Siren.parse(rawSettingsModel);
		    expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
	    });


	    it('parses a raw Model', function () {
		    var bbSiren = Backbone.Siren.parse(rawCollection);
		    expect(bbSiren instanceof Backbone.Siren.Collection).toBeTrue();
	    });


	    it('parses a raw Error', function () {
		    var rawError = {'class': ['error']};
		    var bbSiren = Backbone.Siren.parse(rawError);
		    expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
	    });
    });


    describe('.ajax', function () {
        it('wraps Backbone.ajax', function () {
            this.stub(Backbone, 'ajax');

            Backbone.Siren.ajax({href: 'http://test'});
            expect(Backbone.ajax).toHaveBeenCalled();
        });
    });


	describe('.parseChain()', function () {
		it('parses a url chain string into an array', function () {
			var chain = Backbone.Siren.parseChain('http://api.io/resource');
			expect(chain).toEqual(['http://api.io/resource']);
		});


		it('parses nested url chain strings', function () {
			var chain;

			chain = Backbone.Siren.parseChain('http://api.io/resource#nested');
			expect(chain).toEqual(['http://api.io/resource', 'nested']);

			chain = Backbone.Siren.parseChain('http://api.io/resource#nested#nested2#nested3');
			expect(chain).toEqual(['http://api.io/resource', 'nested', 'nested2', 'nested3']);
		});


		it('throws a TypeError if the argument is not a string', function () {
			expect(function () {
				Backbone.Siren.parseChain({'not-a-string': true});
			}).toThrow('TypeError');
		});
	});


	describe('.stringifyChain()', function () {
		it('converts a chain array into a url string', function () {
			var chain = Backbone.Siren.stringifyChain(['http://api.io/resource']);
			expect(chain).toEqual('http://api.io/resource');
		});


		it('stringifies a nested chain array', function () {
			var chain;

			chain = Backbone.Siren.stringifyChain(['http://api.io/resource', 'nested']);
			expect(chain).toEqual('http://api.io/resource#nested');

			chain = Backbone.Siren.stringifyChain(['http://api.io/resource', 'nested', 'nested2', 'nested3']);
			expect(chain).toEqual('http://api.io/resource#nested#nested2#nested3');
		});


		it('throws a SyntaxError if the arguments not an array', function () {
			expect(function () {
				Backbone.Siren.stringifyChain('not-an-array');
			}).toThrow('TypeError');
		});
	});


	describe('.resolve', function () {
		it('calls .resolveOne if passed a string', function () {
			this.stub(Backbone.Siren, 'resolveOne');
			this.stub(Backbone.Siren, 'resolveMany');

			Backbone.Siren.resolve('http://api.io/frogger');

			expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('http://api.io/frogger');
			expect(Backbone.Siren.resolveMany).not.toHaveBeenCalled();
		});


		it('calls .resolveMany if passed an array', function () {
			this.stub(Backbone.Siren, 'resolveOne');
			this.stub(Backbone.Siren, 'resolveMany');

			Backbone.Siren.resolve(['http://api.io/frogger', 'http://api.io/pacman', 'http://api.io/centipede']);

			expect(Backbone.Siren.resolveOne).not.toHaveBeenCalled();
			expect(Backbone.Siren.resolveMany).toHaveBeenCalledWith(['http://api.io/frogger', 'http://api.io/pacman', 'http://api.io/centipede']);
		});
	});


	describe('.resolveOne', function () {
		var server;

		beforeEach(function () {
			server = sinon.fakeServer.create();
			server.respondWith(JSON.stringify(rawSettingsModel));
		});


		it('uses the first chain item as the "root" url to the chained request', function () {
			var bbSirenRequest = Backbone.Siren.resolveOne('irrelevant-goes-to-fake-server');
			server.respond();

			bbSirenRequest.done(function (bbSiren) {
				expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
				expect(bbSiren.url()).toBe('http://api.x.io/orders/42');
			});

			return bbSirenRequest;
		});
	});


	describe('.resolveMany', function () {

		it('is passed an array and calls .resolveOne() for each item in that array', function () {
			this.stub(Backbone.Siren, 'resolveOne');

			Backbone.Siren.resolveMany(['http://api.io/frogger', 'http://api.io/pacman', 'http://api.io/centipede']);
			expect(Backbone.Siren.resolveOne).toHaveBeenCalledThrice();
		});


		it('each call to .resolveOne() gets its own options object and will not affect the options object of the other .resolveOne() calls', function () {
			// Specifically, since objects are passed by reference, we do not want the options.deferred property from one .resolveOne() call leaking over to the other .resolveOne calls

			var promise
			, store = new Backbone.Siren.Store()
			, modelOne = new Backbone.Siren.Model({links: [{rel: ['self'], href: 'http://api.io/entityOne'}]})
			, modelTwo = new Backbone.Siren.Model({links: [{rel: ['self'], href: 'http://api.io/entityTwo'}]})
			, modelThree = new Backbone.Siren.Model({links: [{rel: ['self'], href: 'http://api.io/entityThree'}]});

			store.addModel(modelOne);
			store.addModel(modelTwo);
			store.addModel(modelThree);

			promise = Backbone.Siren.resolveMany(['http://api.io/entityOne', 'http://api.io/entityTwo', 'http://api.io/entityThree'], {store: store});

			promise.done(function (_modelOne, _modelTwo, _modelThree) {
				expect(_modelOne).toEqual(modelOne);
				expect(_modelTwo).toEqual(modelTwo);
				expect(_modelThree).toEqual(modelThree);
			});

			return promise;
		});
	});


	//
	// Prototype methods
	//

	describe('.init()', function () {
		var sirenApi = new Backbone.Siren('http://blah.io', {'ba': 'boom'});
		sirenApi.init('http://new.io', {'ba': 'bing'});
		expect(sirenApi.apiRoot).toBe('http://new.io');
		expect(sirenApi.options).toEqual({'ba': 'bing'});
	});


	describe('.entityPathToUrl()', function () {
		it('turns an entity path into a full url', function () {
			var sirenApi = new Backbone.Siren('http://blah.io');
			expect(sirenApi.entityPathToUrl('some/path')).toBe('http://blah.io/some/path');
		});


		it('returns the url, as-is, if it\'s an absolute url', function () {
			var sirenApi = new Backbone.Siren('http://blah.io');
			expect(sirenApi.entityPathToUrl('http://blah.io/some/path')).toBe('http://blah.io/some/path');
		});
	});


	describe('.getRootForPath()', function() {
		it('strips the parameters from the path when checking for root path', function() {
			var sirenApi = new Backbone.Siren('/api');
			sirenApi.alternateRoots = {
				'/my/route': '/right'
				,'/my/route?params': '/wrong'
				,'/my/route#anchor': '/also-wrong'
				,'/my/route?params#anchor': '/you-are-never-going-to-pass-this-test'
			};

			expect(sirenApi.getRootForPath('/my/route?params')).toBe('/right');
			expect(sirenApi.getRootForPath('/my/route#anchor')).toBe('/right');
			expect(sirenApi.getRootForPath('/my/route?params#anchor')).toBe('/right');
		});


		it('returns the default root when no alternate root is found for the path', function() {
			var sirenApi = new Backbone.Siren('/right');
			sirenApi.alternateRoots = {
				'/my/other-route': '/wrong'
			};

			expect(sirenApi.getRootForPath('/my/route')).toBe('/right');
		});


		it('returns the alternate root for the path', function() {
			var sirenApi = new Backbone.Siren('/wrong');
			sirenApi.alternateRoots = {
				'/my/route': '/right'
			};

			expect(sirenApi.getRootForPath('/my/route')).toBe('/right');
		});

		
		it('returns the root for the parent of the path when a root is not known for the path', function() {
			var sirenApi = new Backbone.Siren('/wrong');
			sirenApi.alternateRoots = {
				'/parent': '/right'
			};

			expect(sirenApi.getRootForPath('/parent/child')).toBe('/right');
		});
	});


	describe('.resolve()', function () {
		beforeEach(function () {
			this.stub(Backbone.Siren, 'resolve');
		});


		it('resolves an entity from the Siren Api', function () {
			var sirenApi = new Backbone.Siren('http://blah.io');
			var options = {'bon': 'bon'};

			sirenApi.resolve('some/path', options);

			options.store = sirenApi.store;
			expect(Backbone.Siren.resolve).toHaveBeenCalledWith('http://blah.io/some/path', options);
		});


		it('resolves an array of entities from the Siren Api', function () {
			var sirenApi = new Backbone.Siren('http://blah.io');
			var options = {'bon': 'bon'};

			sirenApi.resolve(['some/path', 'some/other/path'], options);

			options.store = sirenApi.store;
			expect(Backbone.Siren.resolve).toHaveBeenCalledWith(['http://blah.io/some/path', 'http://blah.io/some/other/path'], options);
		});
	});
});
