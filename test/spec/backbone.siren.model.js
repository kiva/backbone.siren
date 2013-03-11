/*jshint quotmark: false */
buster.spec.expose();

describe('Siren Model: ', function () {
    'use strict';

    var settingsModelSiren = {"class":["order", "special"],"properties":{"orderNumber":42,"itemCount":3,"status":"pending"},"entities":[{"class":["items","collection"],"rel":["http://x.io/rels/order-items"],"href":"http://api.x.io/orders/42/items"},{"class":["info","customer"],"rel":["http://x.io/rels/customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}],"actions":[{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{name: "addedLater"}, {"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}],"links":[{"rel":["self"],"href":"http://api.x.io/orders/42"},{"rel":["previous"],"href":"http://api.x.io/orders/41"},{"rel":["next"],"href":"http://api.x.io/orders/43"}]}
    , sirenModel;


    beforeEach(function () {
        sirenModel = new Backbone.Siren.Model(settingsModelSiren);
    });


    describe('.url()', function () {
        it('returns a model\'s url, getting it from the href', function () {
            var mySirenModel = new Backbone.Siren.Model({"href": "http://api.x.io/blah"});
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


    describe('.links()', function () {
        it('returns an array of the model\'s links', function () {
            var expectedLinks = settingsModelSiren.links;

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
            this.stub($, 'ajax').returns('jqXhr');
        });

        it('makes an http request for a linked resource and returns an array of jqXhr objects', function () {
            var requests = sirenModel.request('next');

            expect($.ajax).toHaveBeenCalledWith(sinon.match({url: 'http://api.x.io/orders/43'}));
            expect(requests).toBeArray();
            expect(requests[0]).toBe('jqXhr');
        });


        it('returns an empty array if no links match the given rel', function () {
            var result = sirenModel.request('fake');
            expect(result.length).toBe(0);
        });
    });


    describe('.hasClass()', function () {
        it('returns whether a model has a given class', function () {
            expect(sirenModel.hasClass('wtf')).toBe(false);
            expect(sirenModel.hasClass('order')).toBe(true);
        });
    });


    describe('.rel()', function () {
        it('returns a model\'s rel', function () {
            var mySirenModel = new Backbone.Siren.Model({rel:["http://x.io/rels/order-items"]});

            expect(mySirenModel.rel()).toBe('order-items');
        });


        it('returns undefined if there is no rel', function () {
            var mySirenModel = new Backbone.Siren.Model({});

            expect(mySirenModel.rel()).not.toBeDefined();
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
            expect(actions[0].name).toBe('add-item');
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


    describe('.getAllByAction()', function () {
        it('gets all "properties" for a given "action"', function () {
            var expectedProperties = {
                orderNumber: 42
            };

            expect(sirenModel.getAllByAction('add-item')).toMatch(expectedProperties);

            // Make sure it works for attributes that are added during run-time.
            sirenModel.set('addedLater', 'uno');
            expectedProperties.addedLater = 'uno';
            expect(sirenModel.getAllByAction('add-item')).toMatch(expectedProperties);
        });


        it('returns an empty object if the model does not have any matching attributes for the given action', function () {
            var mySirenModel = new Backbone.Siren.Model({actions: [{name: 'do-test'}]});

            expect(mySirenModel.getAllByAction('do-test')).toEqual({});
        });


        it('returns undefined if the action is not found', function () {
            var mySirenModel = new Backbone.Siren.Model({});
            expect(mySirenModel.getAllByAction('non-existent-action')).not.toBeDefined();
        });
    });


    describe('.parseActions()', function () {
        it('parses all "actions" for a given entity and returns an array of Action objects', function () {
            var actions = sirenModel.parseActions();

            _.each(actions, function (action) {
                expect(action instanceof Backbone.Siren.Action).toBeTrue();
            });

            expect(actions[0].name).toBe('add-item');
        });
    });


    it('sets a Backbone Model\'s "attributes" hash to the siren "properties"', function () {
        expect(sirenModel.attributes).toMatch(settingsModelSiren.properties);
    });
});
