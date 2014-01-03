/*jshint quotmark: false */
buster.spec.expose();

describe('Siren Collection: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

    var store, sirenCollection
	, loansCollectionSiren = {"class": ["collection"], "properties": {"offset":4}, "entities":[
		    {"rel":["api.kiva.org/rels/loans"],"properties":{"id":39032,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39032/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39032/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032"}]}
		    , {"rel":["api.kiva.org/rels/loans"],"properties":{"id":39922,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39922/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39922/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922"}]}
		    , {"rel":["api.kiva.org/rels/loans"],"properties":{"id":521056,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/521056/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/521056/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056"}]}], "actions": [{"name": "do-stuff", "fields": [{"name": "offset"}]}
	    ]
		, "links":[
		    {"rel":["self"],"href":"api.kiva.org/lenders/6282/loans?page=4"}
		    , {"rel":["previous"],"href":"api.kiva.org/lenders/6282/loans?page=3"}
		    , {"rel":["next"],"href":"api.kiva.org/lenders/6282/loans?page=5"}
		]
	};


    beforeEach(function () {
	    store = new Backbone.Siren.Store();
        sirenCollection = new Backbone.Siren.Collection(loansCollectionSiren, {store: store});
    });


    describe('.url()', function () {
        it('returns a collection\'s url, getting it from the href', function () {
            var mySirenCollection = new Backbone.Siren.Collection({href: 'http://api.x.io/blah'});
            expect(mySirenCollection.url()).toEqual('http://api.x.io/blah');
        });


        it('returns a collection\'s url, getting it from the "self" link if there is no href', function () {
            expect(sirenCollection.url()).toEqual('api.kiva.org/lenders/6282/loans?page=4');
        });


        it('returns an empty string and warns if there is no url', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});
            this.stub(console, 'warn');

            expect(mySirenCollection.url()).toBe('');
            expect(console.warn).toHaveBeenCalledOnce();
        });
    });


    describe('.classes()', function () {
        it('returns an array of the collection\'s class names', function () {
            expect(sirenCollection.classes()).toEqual(['collection']);
        });


        it('returns undefined if there are no classes', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});
            expect(mySirenCollection.classes()).not.toBeDefined();
        });
    });


	describe('.rel()', function () {
		it('returns an array of the collection\'s rel', function () {
			var myRawSiren = {'class': ['collection'], rel: ['doooodie', 'frogs']};
			var mySirenCollection = new Backbone.Siren.Collection(myRawSiren);
			expect(mySirenCollection.rel()).toEqual(['doooodie', 'frogs']);
		});


		it('returns undefined if rel is not defined', function () {
			expect(sirenCollection.rel()).not.toBeDefined();
		});
	});


    describe('.links()', function () {
        it('returns an array of the collection\'s links', function () {
            var expectedLinks = loansCollectionSiren.links;

            expect(sirenCollection.links()).toMatch(expectedLinks);
        });


        it('returns an empty array if there are no links', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});

            expect(mySirenCollection.links()).toBeArray();
            expect(mySirenCollection.links().length).toBe(0);
        });
    });


    describe('.request()', function () {
        beforeEach(function () {
	        this.stub(Backbone.Siren, 'resolveOne').returns('jqXhr');
        });

	    it('makes an http request for a linked resource and returns a deferred object', function () {
            var requests = sirenCollection.request('next');

	        expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('api.kiva.org/lenders/6282/loans?page=5');
	        expect(requests).toBe('jqXhr');
        });


	    it('returns undefined if no links match the given rel', function () {
            var result = sirenCollection.request('fake');
	        expect(result).not.toBeDefined();
        });
    });


    describe('.hasClass()', function () {
        it('returns whether a collection has a given class', function () {
            expect(sirenCollection.hasClass('wtf')).toBe(false);
            expect(sirenCollection.hasClass('collection')).toBe(true);
        });
    });


	describe('.hasRel()', function () {
		it('returns whether a model has a given class', function () {
			expect(sirenCollection.hasRel('wtf')).toBeFalse();

			var myRawSiren = {'class': ['collection'], rel: ['wtf', 'whistleDixie']};
			var mySirenCollection = new Backbone.Siren.Collection(myRawSiren);
			expect(mySirenCollection.hasRel('whistleDixie')).toBeTrue();
		});
	});


    describe('.title()', function () {
        it('returns a collection\'s title', function () {
            var mySirenCollection = new Backbone.Siren.Collection({title: 'Blame it on my ADD'});

            expect(mySirenCollection.title()).toBe('Blame it on my ADD');
        });


        it('returns undefined if there is no title', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});

            expect(mySirenCollection.title()).not.toBeDefined();
        });
    });


    describe('.actions()', function () {
        it('returns an array of the collection\'s actions', function () {
            var actions = sirenCollection.actions();

            expect(actions).toBeArray();
            expect(actions[0].name).toBe('do-stuff');
        });
    });


    describe('.getActionByName()', function () {
        it('gets a specific action by name', function () {
            var action = sirenCollection.getActionByName('do-stuff');

            expect(action instanceof Backbone.Siren.Action).toBeTrue();
            expect(action.name).toBe('do-stuff');
        });


        it('returns undefined if the name is not found or if the name is not supplied', function () {
            var action = sirenCollection.getActionByName('non-existent-action');
            expect(action).not.toBeDefined();

            action = sirenCollection.getActionByName();
            expect(action).not.toBeDefined();
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
			Backbone.Siren.Collection.prototype.parse.call(obj, loansCollectionSiren, {});

			expect(obj._data).toEqual(loansCollectionSiren);
			expect(obj._meta).toBeDefined();
		});


		it('sets the isLoaded flag', function () {
			this.stub(Backbone.Siren, 'isLoaded').returns('maybeitismaybeitisnt');

			Backbone.Siren.Collection.prototype.parse.call(obj, loansCollectionSiren, {});
			expect(obj.isLoaded).toEqual('maybeitismaybeitisnt');
		});


		it('returns all of the collection\'s models', function () {
			var result = Backbone.Siren.Collection.prototype.parse.call(obj, loansCollectionSiren, {});

			expect(result).toBeArray();
			expect(result.length).toBe(3);
		});


		it('adds the collection to the store, if there is one', function () {
			var options = {store: new Backbone.Siren.Store()};

			Backbone.Siren.Collection.prototype.parse.call(obj, loansCollectionSiren, options);

			expect(options.store.get('http://fake.url')).toBeDefined();
		});
	});


    describe('.toJSON()', function () {
        it('gets all "properties" for a given "action", grouped by object and adding "id"', function () {
            var expectedProperties = [
	            _.extend(sirenCollection.at(0).toJSON(), {id: 39032})
				, _.extend(sirenCollection.at(1).toJSON(), {id: 39922})
				, _.extend(sirenCollection.at(2).toJSON(), {id: 521056})
            ];

            expect(sirenCollection.toJSON({actionName: 'do-stuff'})).toEqual(expectedProperties);
        });


        it('returns an empty array if the collection does not have any matching attributes for the given action', function () {
            var mySirenCollection = new Backbone.Siren.Collection({actions: [{name: 'do-test'}]});

            expect(mySirenCollection.toJSON({actionName: 'do-test'})).toEqual([]);
        });


        it('returns an empty array if the action is not found', function () {
	        var expectedProperties = [
		        sirenCollection.at(0).toJSON()
		        , sirenCollection.at(1).toJSON()
		        , sirenCollection.at(2).toJSON()
	        ];

            expect(sirenCollection.toJSON({actionName: 'non-existent-action'})).toEqual(expectedProperties);
        });
    });


    describe('.parseActions()', function () {
        it('parses all "actions" for a given entity and returns an array of Action objects', function () {
            var actions = sirenCollection.parseActions();

            _.each(actions, function (action) {
                expect(action instanceof Backbone.Siren.Action).toBeTrue();
            });

            expect(actions[0].name).toBe('do-stuff');
        });


        it('warns if an action does not have the required "name" property', function () {
            var warnStub = this.stub(console, 'warn');
            var temp = sirenCollection._data.actions[0].name;

            sirenCollection._data.actions[0].name = undefined;
            sirenCollection.parseActions();
            sirenCollection._data.actions[0].name = temp;

            expect(warnStub).toHaveBeenCalled();
        });
    });


	describe('.resolveNextInChain', function () {

		it('resolves the next entity in the chain', function () {
			this.stub(Backbone.Siren, 'resolveOne');

			sirenCollection.resolveNextInChain([1]);
			expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('api.kiva.org/loans/39922');
		});


		it('appends any remaining chained entities to the next request', function () {
			this.stub(Backbone.Siren, 'resolveOne');

			sirenCollection.resolveNextInChain([1, 'blah', 'shmah']);
			expect(Backbone.Siren.resolveOne).toHaveBeenCalledWith('api.kiva.org/loans/39922#blah#shmah');
		});


		it('resolves with the current entity if the chain is "empty" (uses _.isEmpty)', function () {
			var promise = sirenCollection.resolveNextInChain([]);

			promise.done(function (bbSiren) {
				expect(bbSiren).toEqual(sirenCollection);
			});

			return promise;
		});


		it('resolves with the current entity if the chain is a non-array', function () {
			var promise = sirenCollection.resolveNextInChain('not-an-array');

			promise.done(function (bbSiren) {
				expect(bbSiren).toEqual(sirenCollection);
			});

			return promise;
		});


		it('throws if the next entity in the chain is not an entity on the current Model', function () {
			expect(function () {
				sirenCollection.resolveNextInChain(['non-existent-subentity']);
			}).toThrow('ReferenceError');
		});
	});


	describe('.save()', function () {
		var collectionObj = {
			entities: [
				{
					rel: 'teamSettings'
					, properties: {
						prop1: 'uno'
						, prop2: 'dos'
						, prop3: 'tres'
					}
					, actions: [
						{
							name: 'updateSettings'
							, method: 'POST'
							, href: 'http://x.io/communicationSettings/team1'
							, fields: [
								{name: 'prop1'}
								, {name: 'prop2'}
								, {name: 'prop3'}
							]
						}
					]
					, links: [
						{rel: ['self'], href: 'http://uno'}
					]
				}
				, {
					rel: 'teamSettings'
					, properties: {
						prop1: 'uno'
						, prop2: 'dos'
						, prop3: 'tres'
					}
					, actions: [
						{
							name: 'updateSettings'
							, method: 'POST'
							, href: 'http://x.io/communicationSettings/team1'
							, fields: [
								{name: 'prop1'}
								, {name: 'prop2'}
								, {name: 'prop3'}
							]
						}
					]
					, links: [
						{rel: ['self'], href: 'http://uno'}
					]
				}
				, {
					rel: 'teamSettings'
					, properties: {
						prop1: 'uno'
						, prop2: 'dos'
						, prop3: 'tres'
					}
					, actions: [
						{
							name: 'updateSettings'
							, method: 'POST'
							, href: 'http://x.io/communicationSettings/team1'
							, fields: [
								{name: 'prop1'}
								, {name: 'prop2'}
								, {name: 'prop3'}
							]
						}
					]
					, links: [
						{rel: ['self'], href: 'http://uno'}
					]
				}
			]

			, actions: [
				{
					name: 'updateSettings'
					, 'class': ['batch']
					, method: 'POST'
					, href: 'http://x.io/communicationSettings'
				}
			]

			, links: [
				{
					rel: ['self']
					, href: 'http://x.io/communicationSettings'
				}
			]
		};


		it('returns a jqXhr object', function () {
			sirenCollection = new Backbone.Siren.Collection(collectionObj);
			var result = sirenCollection.save({}, {actionName: 'updateSettings'});

			// @todo poor-man's jqXhr test.
			expect(result.done).toBeFunction();
		});
	});


    it('Adds siren sub-entities as models to a Backbone Collection\'s models property', function () {
        expect(sirenCollection.models).toBeDefined();
        expect(sirenCollection.models.length).toBe(3);

        _.each(sirenCollection.models, function (model) {
            expect(model.cid).toBeDefined();
        });
    });
});
