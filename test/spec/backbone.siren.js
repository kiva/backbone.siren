/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

    var rawSettingsModel = {
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

	var rawCollection = {
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


	describe('.isRawError', function () {
		it('checks if a raw siren object is an error', function () {
			var bbSirenModel = new Backbone.Siren.Model(rawSettingsModel);

			expect(Backbone.Siren.isRawError(rawSettingsModel)).toBeFalse();
			expect(Backbone.Siren.isRawError(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isRawError({'class': ['error']})).toBeTrue();
		});
	});


	describe('.parseModel', function () {

	});


	describe('.parseCollection', function () {
		var rawCurrentCollection = {
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


		it('creates a new collection from a raw collection', function () {
			var collection = Backbone.Siren.parseCollection(rawCurrentCollection);
			expect(collection instanceof Backbone.Siren.Collection).toBeTrue();
		});


		it('re-hydrates an existing collection if it is already cached', function () {
			var store = new Backbone.Siren.Store();
			var collection = new Backbone.Siren.Collection(rawCollection, {store: store});

			// We tag the collection so that we know it's the same one
			collection.tagged = true;

			collection = Backbone.Siren.parseCollection(rawCollection, {store: store});
			expect(collection.tagged).toBeTrue();
		});


		it('adds to an existing "self" and/or "current" collection if parsing a "current" collection', function () {
			var store = new Backbone.Siren.Store();

			var selfCollection = new Backbone.Siren.Collection(rawCollection, {store: store});
			var currentCollection = Backbone.Siren.parseCollection(rawCurrentCollection, {store: store});

			// Check what we have in the store
			selfCollection = store.get('http://api.x.io/orders');
			currentCollection = store.get('http://api.x.io/orders?page=30');

			expect(selfCollection.size()).toBe(4);
			expect(currentCollection.size()).toBe(2);

			// Add more to the current collection
			var anotherRawCurrentCollection =  {
				entities: [
					{"links": [{"rel": ["self"], "href":"http://api.x.io/orders/45"}]}
				]
				, links: [
					{rel: ['self'], href: 'http://api.x.io/orders'}
					, {rel: ['current'], href: 'http://api.x.io/orders?page=30'}
				]
			};

			currentCollection = Backbone.Siren.parseCollection(anotherRawCurrentCollection, {store: store});

			// The currentCollection gets
			expect(selfCollection.size()).toBe(5);
			expect(currentCollection.size()).toBe(3);

		});


		it('returns the cached collection if parsing a "linked" collection, leaving the stored collection untouched', function () {
			var store = new Backbone.Siren.Store();
			var collection = new Backbone.Siren.Collection(rawCollection, {store: store});

			collection = Backbone.Siren.parseCollection({'class': ['collection'], href: 'http://api.x.io/orders'}, {store: store});
			expect(collection.size()).toBe(2);

			// Now check what we have in the store
			collection = store.get(collection.url());
			expect(collection.size()).toBe(2);
		});


		it('re-hydrates both, any matching, stored, "self" and "current" collections if parsing a "current" collection', function () {
			var store = new Backbone.Siren.Store();
			var collection = new Backbone.Siren.Collection(rawCurrentCollection, {store: store});

			// We tag the collection so that we know it's the same one
			collection.tagged = true;

			expect(collection.link('current')).toBeDefined();
			expect(store.get(collection.link('self'))).toBeDefined();
			expect(store.get(collection.link('current'))).toBeDefined();



			expect(collection.tagged).toBeTrue();
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

	describe('.init', function () {
		var sirenApi = new Backbone.Siren('http://blah.io', {'ba': 'boom'});
		sirenApi.init('http://new.io', {'ba': 'bing'});
		expect(sirenApi.apiRoot).toBe('http://new.io');
		expect(sirenApi.options).toEqual({'ba': 'bing'});
	});


	describe('.entityPathToUrl', function () {
		it('turns an entity path into a full url', function () {
			var sirenApi = new Backbone.Siren('http://blah.io');
			expect(sirenApi.entityPathToUrl('some/path')).toBe('http://blah.io/some/path');
		});
	});


	describe('.resolve', function () {
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
