/*jshint quotmark: false */
buster.spec.expose();

describe('Siren Action: ', function () {
    'use strict';

	// @todo quick fix for upgrade to buster 0.7
	var expect = buster.expect;

    var sirenAction = {name: 'add-item', 'class': ['fuzzy', 'fluffy'], title: 'Add Item', method: 'FANCY', href: 'http://api.x.io/orders/42/items', type: 'application/x-fancy-stuff', fields: [{name: 'orderNumber', type: 'hidden', value: '42'}, {name: 'productCode', type: 'text'}, {name: 'quantity', type: 'number' }]}
    , bbSirenAction;


    beforeEach(function () {
        bbSirenAction = new Backbone.Siren.Action(sirenAction);
    });


    describe('.getFieldByName', function () {
        it('gets a specific field by it\'s name', function () {
            expect(bbSirenAction.getFieldByName('quantity')).toEqual({name: 'quantity', type: 'number' });
        });


        it('returns undefined if the field does not exist', function () {
            expect(bbSirenAction.getFieldByName('non-existent-name')).not.toBeDefined();
        });
    });


	describe('.hasClass', function () {
		it('tells us if the action has the given class', function () {
			expect(bbSirenAction.hasClass('test')).toBeFalse();

			bbSirenAction['class'] = ['test'];
			expect(bbSirenAction.hasClass('test')).toBeTrue();
		});
	});


	describe('.match', function () {
		it('Checks if the Siren Action matches the given class', function () {
			expect(bbSirenAction.match({'class': 'chunky'})).toBeFalse();
			expect(bbSirenAction.match({'class': 'fluffy'})).toBeTrue();
		});


		it('Checks if the Siren Action matches the given name', function () {
			expect(bbSirenAction.match({name: 'do-stuff'})).toBeFalse();
			expect(bbSirenAction.match({name: 'add-item'})).toBeTrue();
		});


		it('Checks if the Siren Action matches name and class', function () {
			expect(bbSirenAction.match({name: 'do-stuff', 'class': 'fluffy'})).toBeFalse();
			expect(bbSirenAction.match({name: 'add-item', 'class': 'fluffy'})).toBeTrue();
		});


		it('returns true if a filter is not provided', function () {
			expect(bbSirenAction.match()).toBeTrue();
			expect(bbSirenAction.match({blah: 'shmah'})).toBeTrue();
		});
	});


    describe('.execute()', function () {
        beforeEach(function () {
            this.stub($, 'ajax').returns((new $.Deferred()).promise());
        });


        it('makes an http request to the action\'s href with all appropriate headers and data and returns a jqXhr object', function () {
            var mySirenModel = {href: 'test', actions: [sirenAction]}
            , myBbSirenModel = new Backbone.Siren.Model(mySirenModel);

            var jqXhr = myBbSirenModel.getActionByName('add-item').execute();
            expect($.ajax).toHaveBeenCalled();
            expect(jqXhr).toBePromise();
        });


        it('sets default ajax settings that can be overriden', function () {
            var jqXhr
            , mySirenModel = {href: 'test', actions: [sirenAction]}
            , myBbSirenModel = new Backbone.Siren.Model(mySirenModel);

            // Defaults
            jqXhr = myBbSirenModel.getActionByName('add-item').execute();
            expect($.ajax).toHaveBeenCalledWith(sinon.match({url: 'http://api.x.io/orders/42/items', type: 'FANCY', contentType: 'application/x-fancy-stuff', validate: true}));

            $.ajax.reset();

            // Override
            jqXhr = myBbSirenModel.getActionByName('add-item').execute({type: 'FANCIER', contentType: 'application/x-aaah-shite'});
            expect($.ajax).toHaveBeenCalledWith(sinon.match({url: 'http://api.x.io/orders/42/items', type: 'FANCIER', contentType: 'application/x-aaah-shite'}));
        });


        it('returns undefined if there is no parent to the action', function () {
            expect(bbSirenAction.execute()).not.toBeDefined();
        });


	    it('sets the validationError object on models that fail validation', function () {
		    var mySirenModel = {href: 'test', actions: [sirenAction]}
			, myBbSirenModel = new Backbone.Siren.Model(mySirenModel);

		    this.stub(Backbone.Siren.Model.prototype, 'validate').returns('There was an error');

		    myBbSirenModel.getActionByName('add-item').execute();
		    expect(myBbSirenModel.validationError).toMatch('There was an error');
	    });
    });


	describe('.getSecureKeys()', function () {
		it('gets the secureKeys model', function () {
			bbSirenAction.secureKeys = new Backbone.Model({'uno': 1, 'dos': 2, 'tres': 3});
			expect(bbSirenAction.getSecureKeys()).toEqual(bbSirenAction.secureKeys);
		});


		it('creates and returns a new model if a secureKeys model does not yet exist', function () {
			expect(bbSirenAction.secureKeys).not.toBeDefined();
			bbSirenAction.getSecureKeys();
			expect(bbSirenAction.secureKeys).toBeDefined();
			expect(bbSirenAction.secureKeys.attributes).toEqual({});
		});
	});


	describe('.getSecureKey()', function () {
		it('gets a secure key - wrapper for Backbone.Model.prototype.get()', function () {
			bbSirenAction.setSecureKey('uno', 1);
			expect(bbSirenAction.getSecureKey('uno')).toBe(1);
		});
	});


	describe('.setSecureKey()', function () {
		it('sets a secure key - wrapper for Backbone.Model.prototype.set()', function () {
			var result = bbSirenAction.setSecureKey('uno', 1);
			expect(result.attributes).toEqual({uno: 1});
		});


		it('sets secure keys - wrapper for Backbone.Model.prototype.set()', function () {
			var result = bbSirenAction.setSecureKey({uno: 1, dos: 3, tres: 3});
			expect(result.attributes).toEqual({uno: 1, dos: 3, tres: 3});
		});
	});


	describe('.clearSecureKeys()', function () {
		it('clears all secure keys', function () {
			bbSirenAction.setSecureKey({uno: 1, dos: 3, tres: 3});

			var result = bbSirenAction.clearSecureKeys();
			expect(result.attributes).toEqual({});
		});
	});


	describe('.clearSecureKey()', function () {
		it('clears a secure key', function () {
			bbSirenAction.setSecureKey({uno: 1, dos: 3, tres: 3});

			var result = bbSirenAction.clearSecureKey('dos');
			expect(result.attributes).toEqual({uno: 1, tres: 3});
		});
	});

});

