/*jshint quotmark: false */
buster.spec.expose();

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

