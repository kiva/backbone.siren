/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

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


	describe('.parseChain()', function () {

		it('parses a url chain string', function () {
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


		it('returns the chain argument, unchanged, if its not a string', function () {
			var param = ['http://api.io/resource'];
			var chain = Backbone.Siren.parseChain(param);
			expect(chain).toEqual(param);
		});
	});


    describe('.resolve', function () {
        var server;

        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondWith(JSON.stringify(settingsModelSiren));
        });

	    // @todo this test broke when upgrading to jquery 2.0, see: https://github.com/cjohansen/Sinon.JS/issues/271
	    // Uncomment once buster updates to latest version of sinon.
        it('//uses the first chain item as the "root" url to the chained request', function () {
            var bbSirenRequest = Backbone.Siren.resolve('http://blah');
            server.respond();

            bbSirenRequest.done(function (bbSiren) {
               expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
            });
        });
    });
});
