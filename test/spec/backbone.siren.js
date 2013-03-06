/*jshint quotmark: false */

buster.spec.expose();

var settingsSiren = {"class":["order"],"properties":{"orderNumber":42,"itemCount":3,"status":"pending"},"entities":[{"class":["items","collection"],"rel":["http://x.io/rels/order-items"],"href":"http://api.x.io/orders/42/items"},{"class":["info","customer"],"rel":["http://x.io/rels/customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}],"actions":[{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}],"links":[{"rel":["self"],"href":"http://api.x.io/orders/42"},{"rel":["previous"],"href":"http://api.x.io/orders/41"},{"rel":["next"],"href":"http://api.x.io/orders/43"}]};
var loansCollectionSiren = {"properties":{"offset":4},"entities":[{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39032,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39032/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39032/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39032"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":39922,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/39922/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/39922/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/39922"}]},{"rel":["api.kiva.org/rels/loans"],"properties":{"id":521056,"imgSrc":"kiva.org/img/w800/16310.jpg","name":"Garbanzo Smith","activity":"catering","description":"Guadalupe is 30 years old, married and has three children attending school: Lendy, 6, is in elementary school, Laory is in 5th grade and Cristina is in 2nd "},"entities":[{"rel":["api.kiva.org/rels/images"],"href":"api.kiva/images/16310"},{"rel":["api.kiva.org/rels/payments"],"href":"api.kiva.org/loans/521056/loans"},{"rel":["api.kiva.org/rels/borrowers"],"href":"api.kiva.org/loans/521056/borrowers"},{"rel":["api.kiva.org/rels/terms"],"properties":{"disbursal_amount":5000,"disbursal_currency":"MXN","disbursal_date":"2011-11-29T08:00:00Z","loan_amount":375},"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056/terms"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/loans/521056"}]}],"links":[{"rel":["self"],"href":"api.kiva.org/lenders/6282/loans?page=4"},{"rel":["previous"],"href":"api.kiva.org/lenders/6282/loans?page=3"},{"rel":["next"],"href":"api.kiva.org/lenders/6282/loans?page=5"}]};

describe('Siren Model: ', function () {
    'use strict';

    var sirenModel;

    beforeEach(function () {
        sirenModel = new Backbone.Siren.Model(settingsSiren);
    });


    it('sets siren "properties" to the standard Backbone Model\'s "attributes" hash', function () {
        var expectedProperties = {
            orderNumber: 42
            , itemCount: 3
            , status: "pending"
        };

        expect(sirenModel.attributes).toMatch(expectedProperties);
    });


    describe('.url()', function () {
        it('returns a model\'s url', function () {
            expect(sirenModel.url()).toEqual('http://api.x.io/orders/42');
        });
    });


    describe('.classes()', function () {
        it('returns an array of the model\'s class names', function () {
            expect(sirenModel.classes()).toEqual(['order']);
        });
    });


    describe('.links()', function () {
        it('returns an array of the model\'s links', function () {
            var expectedLinks = [{rel: ['self'], href: 'http://api.x.io/orders/42'}
                , {rel: ['previous'], href: 'http://api.x.io/orders/41'}
                , {rel: ['next'], href: 'http://api.x.io/orders/43'}
            ];

            expect(sirenModel.links()).toMatch(expectedLinks);
        });

    });


    describe('.request()', function () {
        it('makes an http request for the linked resource', function () {
            this.stub($, 'ajax');

            sirenModel.request('next');
            expect($.ajax).toHaveBeenCalled();
//        @todo expect($.ajax).toHaveBeenCalledWithMatch({url: 'http://api.x.io/orders/43'});
        });
    });


    describe('.hasClass()', function () {
        it('returns if a model has a given class', function () {
            expect(sirenModel.hasClass('wtf')).toBe(false);
            expect(sirenModel.hasClass('order')).toBe(true);
        });
    });


    describe('.rel()', function () {
        it('returns a model\'s rel', function () {
            var mySiren = {"rel":["http://x.io/rels/order-items"]}
                , mySirenModel = new Backbone.Siren.Model(mySiren);

            expect(mySirenModel.rel()).toBe('order-items');
        });
    });


    describe('.title()', function () {
        it('returns a model\'s title', function () {
            var mySiren = {title: 'Blame it on my ADD'}
                , mySirenModel = new Backbone.Siren.Model(mySiren);

            expect(mySirenModel.title()).toBe('Blame it on my ADD');
        });
    });


    describe('.actions()', function () {
        it('returns a model\'s actions', function () {
            var actions = sirenModel.actions();

            expect($.isArray(actions)).toBe(true);
            expect(actions[0].name).toBe('add-item');
        });
    });


    describe('.getActionByName()', function () {
        it('gets a specific action by name', function () {
            var action = sirenModel.getActionByName('add-item');

            expect(action.name).toBe('add-item');
        });
    });


    describe('.getAllByAction()', function () {
        it('get\'s all "properties" for a given "action"', function () {
            var expectedProperties = {
                orderNumber: 42
            };

            expect(sirenModel.getAllByAction('add-item')).toMatch(expectedProperties);
        });
    });


    describe('.parseActions()', function () {
        it('parses all "actions" for a given entity', function () {
            var actions = sirenModel.parseActions();

            expect(actions[0].name).toBe('add-item');
        });
    });
});

describe('Siren Collection', function () {
    'use strict';

    it('provides access to a collection\'s url', function () {
        var sirenCollection = new Backbone.Siren.Collection(loansCollectionSiren);

        expect(sirenCollection.url()).toEqual('api.kiva.org/lenders/6282/loans?page=4');
    });
});


describe('Siren Action', function () {
    'use strict';

    var sirenAction = {"name": "add-item","title": "Add Item","method": "POST","href": "http://api.x.io/orders/42/items","type": "application/x-www-form-urlencoded","fields": [{ "name": "orderNumber", "type": "hidden", "value": "42" },{ "name": "productCode", "type": "text" },{ "name": "quantity", "type": "number" }]}
        , bbSirenAction;

    beforeEach(function () {
        bbSirenAction = new Backbone.Siren.Action(sirenAction);
    });

    it('gets an action\'s field by name using .getFieldByName', function () {
        expect(bbSirenAction.getFieldByName('orderNumber')).toEqual({ "name": "orderNumber", "type": "hidden", "value": "42" });
    });


});

