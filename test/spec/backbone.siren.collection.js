/*jshint quotmark: false */
buster.spec.expose();

describe('Siren Collection: ', function () {
    'use strict';

    var loansCollectionSiren = {"class": ["collection"], "properties": {"offset":4}, "entities":[{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39032,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39032/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39032/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39922,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39922/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39922/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":521056,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/521056/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/521056/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056"}]}], "actions": [{"name": "do-stuff", "fields": [{"name": "offset"}]}], "links":[{"rel":["self"],"href":"api.kiva.org/lenders/6282/loans?page=4"},{"rel":["previous"],"href":"api.kiva.org/lenders/6282/loans?page=3"},{"rel":["next"],"href":"api.kiva.org/lenders/6282/loans?page=5"}]}
    , sirenCollection;


    beforeEach(function () {
        sirenCollection = new Backbone.Siren.Collection(loansCollectionSiren);
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


        it('returns an empty array if there are no classes', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});
            expect(mySirenCollection.classes()).toBeArray();
            expect(mySirenCollection.classes().length).toBe(0);
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
            this.stub($, 'ajax').returns('jqXhr');
        });

        it('makes an http request for a linked resource and returns an array of jqXhr objects', function () {
            var requests = sirenCollection.request('next');

            expect($.ajax).toHaveBeenCalledWith(sinon.match({url: 'api.kiva.org/lenders/6282/loans?page=5'}));
            expect(requests).toBeArray();
            expect(requests[0]).toBe('jqXhr');
        });


        it('returns an empty array if no links match the given rel', function () {
            var result = sirenCollection.request('fake');
            expect(result.length).toBe(0);
        });
    });


    describe('.hasClass()', function () {
        it('returns whether a collection has a given class', function () {
            expect(sirenCollection.hasClass('wtf')).toBe(false);
            expect(sirenCollection.hasClass('collection')).toBe(true);
        });
    });


    describe('.rel()', function () {
        it('returns a collection\'s rel', function () {
            var mySirenCollection = new Backbone.Siren.Collection({rel:["http://x.io/rels/order-items"]});
            expect(mySirenCollection.rel()).toBe('order-items');
        });


        it('returns undefined if there is no rel', function () {
            var mySirenCollection = new Backbone.Siren.Collection({});

            expect(mySirenCollection.rel()).not.toBeDefined();
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


    describe('.getAllByAction()', function () {
        it('gets all "properties" for a given "action"', function () {
            var expectedProperties = {
                offset: 4
            };

            expect(sirenCollection.getAllByAction('do-stuff')).toMatch(expectedProperties);
        });


        it('returns an empty object if the collection does not have any matching attributes for the given action', function () {
            var mySirenCollection = new Backbone.Siren.Collection({actions: [{name: 'do-test'}]});

            expect(mySirenCollection.getAllByAction('do-test')).toEqual({});
        });


        it('returns undefined if the action is not found', function () {
            var mySirenModel = new Backbone.Siren.Model({});
            expect(mySirenModel.getAllByAction('non-existent-action')).not.toBeDefined();
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


        it('//warns if an action does not have the *required* "name" property', function () {
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