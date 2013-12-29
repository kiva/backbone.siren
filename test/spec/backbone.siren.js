/*jshint quotmark: false */
buster.spec.expose();

describe('Backbone.Siren: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

    var settingsModelSiren = {"class":["order", "special"],"properties":{"orderNumber":42,"itemCount":3,"status":"pending"},"entities":[{"class":["items","collection"],"rel":["http://x.io/rels/order-items", "name:order-items"],"href":"http://api.x.io/orders/42/items"},{"class":["info","customer"],"rel":["http://x.io/rels/customer", "name:customer"],"properties":{"customerId":"pj123","name":"Peter Joseph"},"links":[{"rel":["self"],"href":"http://api.x.io/customers/pj123"}]}],"actions":[{"name":"add-item","title":"Add Item","method":"POST","href":"http://api.x.io/orders/42/items","type":"application/x-www-form-urlencoded","fields":[{name: "addedLater"}, {"name":"orderNumber","type":"hidden","value":"42"},{"name":"productCode","type":"text"},{"name":"quantity","type":"number"}]}],"links":[{"rel":["self"],"href":"http://api.x.io/orders/42"},{"rel":["previous"],"href":"http://api.x.io/orders/41"},{"rel":["next"],"href":"http://api.x.io/orders/43"}]};
	var sirenCollection = {
		"class": ["collection"]
		, "entities": [
			{
				"links": [
					{"rel":["self"],"href":"http://api.x.io/orders/41"}
				]
			}
			, {
				"links": [
					{"rel":["self"],"href":"http://api.x.io/orders/42"}
				]
			}
		]
	};


	describe('.isHydratedObject', function () {

		it('checks if an object is an instantiated Backbone.Siren object', function () {
			var bbSirenModel = new Backbone.Siren.Model(settingsModelSiren);

			expect(Backbone.Siren.isHydratedObject(settingsModelSiren)).toBeFalse();
			expect(Backbone.Siren.isHydratedObject(bbSirenModel)).toBeTrue();

			var bbSirenCollection = new Backbone.Siren.Collection(sirenCollection);

			expect(Backbone.Siren.isHydratedObject(sirenCollection)).toBeFalse();
			expect(Backbone.Siren.isHydratedObject(bbSirenCollection)).toBeTrue();
		});
	});


	describe('.isHydratedCollection', function () {

		it('checks if a backbone.siren object is a collection', function () {
			var bbSirenModel = new Backbone.Siren.Model(settingsModelSiren);
			var bbSirenCollection = new Backbone.Siren.Collection(sirenCollection);

			expect(Backbone.Siren.isHydratedCollection(settingsModelSiren)).toBeFalse();
			expect(Backbone.Siren.isHydratedCollection(sirenCollection)).toBeFalse();
			expect(Backbone.Siren.isHydratedCollection(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isHydratedCollection(bbSirenCollection)).toBeTrue();
		});
	});


	describe('.isRawCollection', function () {

		it('checks if a siren json object is a collection', function () {
			var bbSirenModel = new Backbone.Siren.Model(settingsModelSiren);
			var bbSirenCollection = new Backbone.Siren.Collection(sirenCollection);

			expect(Backbone.Siren.isRawCollection(settingsModelSiren)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(bbSirenCollection)).toBeFalse();
			expect(Backbone.Siren.isRawCollection(sirenCollection)).toBeTrue();
		});
	});


	describe('.isRawError', function () {

		it('checks if a raw siren object is an error', function () {
			var bbSirenModel = new Backbone.Siren.Model(settingsModelSiren);
			var bbSirenCollection = new Backbone.Siren.Collection(sirenCollection);

			expect(Backbone.Siren.isRawError(settingsModelSiren)).toBeFalse();
			expect(Backbone.Siren.isRawError(bbSirenModel)).toBeFalse();
			expect(Backbone.Siren.isRawError({class: ['error']})).toBeTrue();
		});
	});


    describe('.parse', function () {

        it('parses an entity from a plain Siren object to a Backbone.Siren object and returns the result', function () {
            var bbSiren = Backbone.Siren.parse(settingsModelSiren);
            expect(bbSiren instanceof Backbone.Siren.Model).toBeTrue();
        });


	    // @todo - we no longer add them to the model on Backbone.Model.parse, instead its done on Backbone.Model.prototype.parse
        it('adds Backbone.Siren object to the store IF its a model', function () {
	        var store = new Backbone.Siren.Store();
            var urlKey = settingsModelSiren.links[0].href;

            expect(store.exists(urlKey)).toBeFalse();

            Backbone.Siren.parse(settingsModelSiren, store);
            expect(store.exists(urlKey)).toBeTrue();
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
