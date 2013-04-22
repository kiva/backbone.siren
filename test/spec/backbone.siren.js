/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
    'use strict';


    var settingsModelSiren = {"class":["order", "special"],"properties":{"orderNumber":42,"itemCount":3,"status":"pending"},"entities":[{"class":["items","collection"],"rel":["http://x.io/rels/order-items", "name:order-items"],"href":"http://api.x.io/orders/42/items"},{"class":["info","customer"],"rel":["http://x.io/rels/customer", "name:customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}],"actions":[{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{name: "addedLater"}, {"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}],"links":[{"rel":["self"],"href":"http://api.x.io/orders/42"},{"rel":["previous"],"href":"http://api.x.io/orders/41"},{"rel":["next"],"href":"http://api.x.io/orders/43"}]};


    describe('.parse', function () {

        it('parses an entity from a plain Siren object to a Backbone.Siren object and returns the result', function () {
            var bbSiren = Backbone.Siren.parse(settingsModelSiren);
            expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
        });


        it('adds Backbone.Siren object to the store IF its a model', function () {
            var urlKey = settingsModelSiren.links[0].href;

            Backbone.Siren.store.clear(); // @todo revisit the need to "clear" once the api for the store is finalized.
            expect(Backbone.Siren.store.exists(urlKey)).toBeFalse();

            Backbone.Siren.parse(settingsModelSiren);
            expect(Backbone.Siren.store.exists(urlKey)).toBeTrue();
        });
    });


    describe('.ajax', function () {

        it('wraps Backbone.ajax', function () {
            this.stub(Backbone, 'ajax');

            Backbone.Siren.ajax({href: 'http://test'});
            expect(Backbone.ajax).toHaveBeenCalled();
        });
    });


    describe('.resolveChain', function () {

        it('//Uses the first chain item as the root url to the chained request', function () {
            var chainedRequest = Backbone.Siren.resolveChain('http://bbsiren/examples/settings.siren.json');

            chainedRequest.done(function (bbsiren) {
                console.log('hioijlkkjlkj');
                console.log(bbsiren);
            });
        });
    });
});