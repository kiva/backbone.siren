/*jshint quotmark: false */
buster.spec.expose();

describe('Siren Action: ', function () {
    'use strict';

    var sirenAction = {"name": "add-item","title": "Add Item","method": "POST","href": "http://api.x.io/orders/42/items","type": "application/x-www-form-urlencoded","fields": [{ "name": "orderNumber", "type": "hidden", "value": "42" },{ "name": "productCode", "type": "text" },{ "name": "quantity", "type": "number" }]}
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


    describe('.execute', function () {
        beforeEach(function () {
            this.stub($, 'ajax').returns('jqXhr');
        });


        it('makes an http request to the action\'s href with all appropriate headers and data and returns a jqXhr object', function () {
            var mySirenModel = {href: 'test', actions: [sirenAction]}
            , myBbSirenModel = new Backbone.Siren.Model(mySirenModel);

            var jqXhr = myBbSirenModel.getActionByName('add-item').execute();
            expect($.ajax).toHaveBeenCalled();
            expect(jqXhr).toBe('jqXhr');
        });


        it('returns undefined if there is no parent to the action', function () {
            expect(bbSirenAction.execute()).not.toBeDefined();
        });
    });


    it('gets an action\'s field by name using .getFieldByName', function () {
        expect(bbSirenAction.getFieldByName('orderNumber')).toEqual({ "name": "orderNumber", "type": "hidden", "value": "42" });
    });
});

