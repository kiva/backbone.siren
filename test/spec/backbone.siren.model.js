/*jshint quotmark: false */

describe('Siren Model: ', function () {
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
		    {name: "simple-add", method: "POST", href: "http://api.x.io/orders", fields: [{name: "orderNumber"}]}
            , {"name": "add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{name: "addedLater"}, {"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}
			, {"name": "update-customer","method": "POST", "href": "http://api.x.io/customers", fields: [{name: "customer"}]}
        ]
        ,"links":[
            {"rel":["self"],"href": "http://api.x.io/orders/42"}
		    , {"rel":["previous"],"href": "http://api.x.io/orders/41"}
		    , {"rel":["next"],"href": "http://api.x.io/orders/43"}
        ]
    }
    , sirenModel, store;


    beforeEach(function () {
	    store = new Backbone.Siren.Store();
        sirenModel = new Backbone.Siren.Model(rawSettingsModel, {store: store});
    });


	describe('.constructor()', function () {
		it('adds the model to the store, if a store is provided', function () {
			var store = new Backbone.Siren.Store()
			, model = new Backbone.Siren.Model(rawSettingsModel, {store: store});

			expect(store.exists(model)).toBeTrue();
		});
	});


    describe('.url()', function () {
	    it('is a proxy to this.link(\'self\')', function () {
		    this.stub(sirenModel, 'link');
			sirenModel.url();
		    expect(sirenModel.link).toHaveBeenCalled();
	    });


        it('returns a model\'s url, getting it from the href', function () {
            var mySirenModel = new Backbone.Siren.Model({href: 'http://api.x.io/blah'});
            expect(mySirenModel.url()).toEqual('http://api.x.io/blah');
        });


        it('returns a model\'s url, getting it from the "self" link if there is no href', function () {
            expect(sirenModel.url()).toEqual('http://api.x.io/orders/42');
        });


        it('returns an empty string and warns if there is no url', function () {
            var mySirenModel = new Backbone.Siren.Model({});
            this.stub(console, 'warn');

            expect(mySirenModel.url()).toBe('');
            expect(console.warn).toHaveBeenCalledOnce();
        });
    });


    describe('.classes()', function () {
        it('returns an array of the model\'s class names', function () {
            expect(sirenModel.classes()).toEqual(['order', 'special']);
        });


        it('returns an empty array if there are no classes', function () {
            var mySirenModel = new Backbone.Siren.Model({});
	        expect(mySirenModel.classes()).toBeArray();
	        expect(mySirenModel.classes().length).toBe(0);
        });
    });


	describe('.rel()', function () {
		it('returns an array of the models\'s rel', function () {
			var myRawSiren = {rel: ['doooodie', 'frogs']};
			var mySirenModel = new Backbone.Siren.Model(myRawSiren);
			expect(mySirenModel.rel()).toEqual(['doooodie', 'frogs']);
		});


		it('returns an empty array if rel is not defined', function () {
			expect(sirenModel.rel()).toBeArray();
			expect(sirenModel.rel().length).toBe(0);
		});
	});


	describe('.link()', function () {
		it('returns a model\'s link, finding the first that matches the given rel', function () {
			expect(sirenModel.link('previous')).toBe('http://api.x.io/orders/41');
		});


		it('returns undefined if there is no link with that rel', function () {
			expect(sirenModel.link('non-existent')).not.toBeDefined();
		});
	});


    describe('.links()', function () {
        it('returns an array of the model\'s links', function () {
            var expectedLinks = rawSettingsModel.links;

            expect(sirenModel.links()).toMatch(expectedLinks);
        });


        it('returns an empty array if there are no links', function () {
            var mySirenModel = new Backbone.Siren.Model({})
            , links = mySirenModel.links();

            expect(links).toBeArray();
            expect(links.length).toBe(0);
        });
    });


    describe('.request()', function () {
        beforeEach(function () {
            this.stub(Backbone.Siren, 'resolveOne').returns('jqXhr');
        });

        it('makes an http request for a linked resource and returns a deferred object', function () {
            var requests = sirenModel.request('next');

            expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('http://api.x.io/orders/43');
            expect(requests).toBe('jqXhr');
        });


        it('returns undefined if no links match the given rel', function () {
            var result = sirenModel.request('fake');
            expect(result).not.toBeDefined();
        });
    });


	describe('.resolve()', function () {
		it('merges siren.ajaxOptions onto each each call', function () {
			var options = {forceFetch: true, type: 'blah'};

			this.stub(sirenModel, 'fetch');
			sirenModel.siren.ajaxOptions = {dataType: 'json'};
			sirenModel.resolve(options);

			expect(sirenModel.fetch).toHaveBeenCalledWith(sinon.match({forceFetch: true, type: 'blah', dataType: 'json'}));
		});
	});


    describe('.hasClass()', function () {
        it('returns whether a model has a given class', function () {
            expect(sirenModel.hasClass('wtf')).toBeFalse();
            expect(sirenModel.hasClass('order')).toBeTrue();
        });
    });


	describe('.hasRel()', function () {
		it('returns whether a model has a given class', function () {
			expect(sirenModel.get('order-items').hasRel('wtf')).toBeFalse();
			expect(sirenModel.get('order-items').hasRel('http://x.io/rels/order-items')).toBeTrue();
		});
	});


    describe('.entities', function () {
        it('returns an array of the model\'s sub-entities', function () {
            expect(sirenModel.entities().length).toBe(rawSettingsModel.entities.length);
        });


	    it('allows for filtering down of sub-entities', function () {
		    this.stub(Backbone.Siren.Model.prototype, 'match');

		    var filter = {'some-filter': true};

		    sirenModel.entities(filter);
		    expect(Backbone.Siren.Model.prototype.match).toHaveBeenCalledWith(filter);
	    });
    });


    describe('.title()', function () {
        it('returns a model\'s title', function () {
            var mySirenModel = new Backbone.Siren.Model({title: 'Blame it on my ADD'});

            expect(mySirenModel.title()).toBe('Blame it on my ADD');
        });


        it('returns undefined if there is no title', function () {
            var mySirenModel = new Backbone.Siren.Model({});

            expect(mySirenModel.title()).not.toBeDefined();
        });
    });


    describe('.actions()', function () {
        it('returns an array of the model\'s actions', function () {
            var actions = sirenModel.actions();

            expect($.isArray(actions)).toBe(true);
	        expect(actions[0].name).toBe('simple-add');
            expect(actions[1].name).toBe('add-item');
        });
    });


    describe('.getActionByName()', function () {
        it('gets a specific action by name', function () {
            var action = sirenModel.getActionByName('add-item');

            expect(action instanceof Backbone.Siren.Action).toBeTrue();
            expect(action.name).toBe('add-item');
        });


        it('returns `undefined` if the name is not found or if the name is not supplied', function () {
            var action = sirenModel.getActionByName('non-existent-action');
            expect(action).not.toBeDefined();

            action = sirenModel.getActionByName();
            expect(action).not.toBeDefined();
        });
    });


	describe('.match()', function () {
		it('Checks if a model matches by class.', function () {
			expect(sirenModel.match({'class': 'wtf'})).toBeFalse();
			expect(sirenModel.match({'class': 'order'})).toBeTrue();
		});

		it('Checks if a model matches by rel.', function () {
			expect(sirenModel.get('order-items').match({'rel': 'wtf'})).toBeFalse();
			expect(sirenModel.get('order-items').match({'rel': 'http://x.io/rels/order-items'})).toBeTrue();
		});
	});


	describe('.parse()', function () {
		var obj = {};

		beforeEach(function () {
			obj.resolveEntities = this.spy();
			obj.url = this.stub().returns('http://fake.url');

			this.stub(Backbone.Siren.Model.prototype, 'resolveEntities');
		});


		it('parses the raw entity and initializes some settings on the model', function () {
			Backbone.Siren.Model.prototype.parse.call(obj, rawSettingsModel, {});

			expect(obj._data).toEqual(rawSettingsModel);
			expect(obj._entities).toBeArray();
		});


		it('resolves all sub-entities', function () {
			var options = {someSetting: 'blah'};

			Backbone.Siren.Model.prototype.parse.call(obj, rawSettingsModel, options);
			expect(obj.resolveEntities).toHaveBeenCalledWith(options);
		});


		it('sets the isLoaded flag', function () {
			this.stub(Backbone.Siren, 'isLoaded').returns('maybeitismaybeitisnt');

			Backbone.Siren.Model.prototype.parse.call(obj, rawSettingsModel, {});
			expect(obj.isLoaded).toEqual('maybeitismaybeitisnt');
		});


		it('returns all of the entity\'s properties', function () {
			var result = Backbone.Siren.Model.prototype.parse.call(obj, rawSettingsModel, {});

			expect(result).toEqual(rawSettingsModel.properties);
		});
	});


    describe('.toJSON()', function () {
	    it('returns an object with all the model\'s attributes', function () {
		    var props = {boom: "ba", bastic: "da"};
		    var model = new Backbone.Siren.Model({properties: props, links: [{rel: ["self"], href: "http://dada"}]});

		    expect(model.toJSON()).toEqual(props);
	    });


	    it('returns an object with all the model\'s attributes as well as the attributes in any nested models', function () {

		    var expected = _.extend(
			    _.clone(rawSettingsModel.properties)
			    , {customer: sirenModel.get('customer').attributes}
			    , {'order-items': []} // Empty, nested entities are represented as an empty array
		    );

		    expect(sirenModel.toJSON()).toEqual(expected);
	    });


        it('if passed an action name, returns an object with only those attributes that correspond to the action', function () {
            var expectedProperties = {
                orderNumber: 42
            };

            expect(sirenModel.toJSON({actionName: 'add-item'})).toMatch(expectedProperties);

            // Make sure it works for attributes that are added during run-time.
            sirenModel.set('addedLater', 'uno');
            expectedProperties.addedLater = 'uno';
            expect(sirenModel.toJSON({actionName: 'add-item'})).toMatch(expectedProperties);
        });


		it('if passed an action name, is recursive on any entities that correspond to the action', function () {
			expect(sirenModel.toJSON({actionName: 'update-customer'})).toEqual({customer: sirenModel.get('customer').attributes});
		});


        it('returns an empty object if the model does not have any matching attributes for the given action', function () {
	        // @todo should probably throw instead.

            var mySirenModel = new Backbone.Siren.Model({actions: [{name: 'do-test'}]});

            expect(mySirenModel.toJSON({actionName: 'do-test'})).toEqual({});
        });


        it('returns an object with all the model\'s attributes if the action is not found', function () {
	        var props = {boom: "ba", bastic: "da"};
	        var model = new Backbone.Siren.Model({properties: props, links: [{rel: ["self"], href: "http://dada"}]});

	        expect(model.toJSON()).toEqual(props);
        });
    });


    describe('.parseActions()', function () {
        it('parses all "actions" for a given entity and returns an array of Action objects', function () {
            var actions = sirenModel.parseActions();

            _.each(actions, function (action) {
                expect(action instanceof Backbone.Siren.Action).toBeTrue();
            });

	        expect(actions[0].name).toBe('simple-add');
            expect(actions[1].name).toBe('add-item');
        });


        it('warns if an action does not have the *required* "name" property', function () {
            var warnStub = this.stub(console, 'warn');
            var temp = sirenModel._data.actions[0].name;

            sirenModel._data.actions[0].name = undefined;
            sirenModel.parseActions();
            sirenModel._data.actions[0].name = temp;

            expect(warnStub).toHaveBeenCalled();
        });
    });


    describe('.resolveEntity()', function () {

        it ('returns the bbSiren object wrapped in a Deferred object', function () {
            var subEntity = {href: 'http://test.com', name: 'mySubEntity'}
            , deferredEntity = sirenModel.resolveEntity(subEntity);

            deferredEntity.done(function (bbSiren) {
                expect(bbSiren.url()).toEqual(subEntity.href);
            });
        });


        it('returns the bbSiren object from the store if it\'s already cached', function () {
	        var xhr = sinon.useFakeXMLHttpRequest()
	        , requests = []
	        , subEntity = {
		        name: 'testEntity'
		        , links: [
			        {rel: ['self'], href: 'http://boston.com'}
		        ]
	        };

	        xhr.onCreate = function (xhr) {
		        requests.push(xhr);
	        };

            sirenModel.resolveEntity(subEntity, {autoFetch: 'all', store: store});

	        // Provide a fake response
	        requests[0].respond(200
		        , { "Content-Type": "application/json" }
		        , JSON.stringify(subEntity)
	        );

	        this.spy($, 'ajax');
	        sirenModel.resolveEntity(subEntity, {autoFetch: 'all', store: store});
            expect($.ajax).not.toHaveBeenCalled();
        });


        it('returns the bbSiren object from the store if it\'s already cached plus sets it on the parent if it\'s not already there', function () {
	        var xhr = sinon.useFakeXMLHttpRequest()
			, requests = []
		    , subEntity = {
		        name: 'testEntity'
		        , links: [
			        {rel: ['self'], href: 'http://boston.com'}
		        ]
		    };

	        xhr.onCreate = function (xhr) {
		        requests.push(xhr);
	        };

            sirenModel.resolveEntity(subEntity, {autoFetch: 'all', store: store});

	        // Provide a fake response
	        requests[0].respond(200
		        , { "Content-Type": "application/json" }
		        , JSON.stringify(subEntity)
	        );

            // Remove the entities name from the _entities array
            sirenModel.unset(subEntity.name);
            expect(sirenModel.get(subEntity.name)).not.toBeDefined();

            // Resolving again should add the entity name back in
            sirenModel.resolveEntity(subEntity, {autoFetch: 'all', store: store});
            expect(sirenModel.get(subEntity.name)).toBeDefined();
        });


        it('throws if called with an invalid entity', function () {
            expect(function () {
                sirenModel.resolveEntity();
            }).toThrow();
        });
    });


	describe('.resolveEntities', function () {
		it('resolves all child entities', function () {
			var options = {testOptions: 'blah'};

			store.data = {};

			this.stub(sirenModel, 'resolveEntity');
			sirenModel.resolveEntities(options);

			expect(sirenModel.resolveEntity).toHaveBeenCalledTwice();
			expect(sirenModel.resolveEntity).toHaveBeenCalledWith(sirenModel.get('order-items')._data, options);
			expect(sirenModel.resolveEntity).toHaveBeenCalledWith(sirenModel.get('customer')._data, options);
		});


		it('triggers a "resolve" event when all child entities have been resolved.', function () {
			var deferred = new $.Deferred()
			, callback = this.stub();

			this.stub(sirenModel, 'resolveEntity').returns(deferred);

			sirenModel.on('resolve', callback);
			sirenModel.resolveEntities();

			deferred.done(function () {
				expect(callback).toHaveBeenCalled();
			});

			deferred.resolve();

			return deferred.promise();
		});
	});


    describe('.setEntity()', function () {

        it ('sets a raw Siren object as a model on the parent entity', function () {
            sirenModel.setEntity(new Backbone.Siren.Model({properties: {one: 'uno'}, name: 'testEntity'}), [], 'testEntity');

            expect(sirenModel.get('testEntity')).toBeDefined();
        });


        it ('does not set the model if the sub-entity does not have a "name"', function () {
            sirenModel.setEntity({properties: {one: 'uno'}});

            expect(sirenModel.get('testEntity')).not.toBeDefined();
        });
    });


	describe('.resolveNextInChain', function () {

		it('resolves the next entity in the chain', function () {
			this.stub(Backbone.Siren, 'resolveOne');

			sirenModel.resolveNextInChain(['customer']);
			expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('http://api.x.io/customers/pj123');
		});


		it('appends any remaining chained entities to the next request', function () {
			this.stub(Backbone.Siren, 'resolveOne');

			sirenModel.resolveNextInChain(['customer', 'blah', 'shmah']);
			expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('http://api.x.io/customers/pj123#blah#shmah');
		});


		it('resolves with the current entity if the chain is "empty" (uses _.isEmpty)', function () {
			var promise = sirenModel.resolveNextInChain([]);

			promise.done(function (bbSiren) {
				expect(bbSiren).toEqual(sirenModel);
			});

			return promise;
		});


		it('resolves with the current entity if the chain is a non-array', function () {
			var promise = sirenModel.resolveNextInChain('not-an-array');

			promise.done(function (bbSiren) {
				expect(bbSiren).toEqual(sirenModel);
			});

			return promise;
		});


		it('throws if the next entity in the chain is not an entity on the current Model', function () {
			expect(function () {
				sirenModel.resolveNextInChain(['non-existent-subentity']);
			}).toThrow('ReferenceError');
		});
	});


	describe('.update()', function () {
		var myRawModel = {
			'class': ['updated']
			, properties: {
					blah: 'shmah'
			}
			, links: [
				{rel: ['self'], href: 'http://x.io'}
			]
		};


		it('updates all properties on the model', function () {
			sirenModel.update(myRawModel);
			expect(sirenModel.get('blah')).toBe('shmah');
		});


		it('updates all top level properties on the model', function () {
			sirenModel.update(myRawModel);
			expect(sirenModel.url()).toBe(myRawModel.links[0].href);
			expect(sirenModel.actions().length).toBe(0);
			expect(sirenModel.classes()).toEqual(myRawModel['class']);
		});


		it('does not alter the model if updating with a "linked" entity', function () {
			sirenModel.update({href: 'http://x.io/updated'});
			expect(sirenModel.url()).toBe('http://api.x.io/orders/42');
		});


		it('returns the model', function () {
			expect(sirenModel.update(myRawModel)).toBe(sirenModel);
		});
	});


	describe('.siren', function () {
		it('is an object that is set each BbSiren Model upon instantiation', function () {
			var myModel = new Backbone.Siren.Model();
			expect(myModel.siren).toBeObject();
		});


		it('has a store if provided via the options', function () {
			var myModel = new Backbone.Siren.Model({href: 'blah'}, {store: new Backbone.Siren.Store()});
			expect(myModel.siren.store).toBeObject();
		});


		it('has a ajaxOptions if provided via the options', function () {
			var ajaxOptions = {data: {blah: true}, type: 'json'}
			, myModel = new Backbone.Siren.Model({href: 'blah'}, {ajaxOptions: ajaxOptions});

			expect(myModel.siren.ajaxOptions).toBeObject();
			expect(myModel.siren.ajaxOptions).toEqual(ajaxOptions);
		});
	});


    it('sets a Backbone Model\'s "attributes" hash to the siren "properties"', function () {
        expect(sirenModel.attributes).toMatch(rawSettingsModel.properties);
    });
});
