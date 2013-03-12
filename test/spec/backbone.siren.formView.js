/*jshint quotmark: false */
buster.spec.expose();

describe('Siren FormView: ', function () {
    'use strict';

    var sirenAction = {"name": "add-item","title": "Add Item","method": "POST","href": "http://api.x.io/orders/42/items","type": "application/x-www-form-urlencoded","fields": [{ "name": "orderNumber", "type": "hidden", "value": "42" },{ "name": "productCode", "type": "text" },{ "name": "quantity", "type": "number" }]}
    , bbSirenAction, bbSirenFormView;


    beforeEach(function () {
        bbSirenAction = new Backbone.Siren.Action(sirenAction);
        bbSirenAction.parent = new Backbone.Siren.Model({"class": 'test'});
        bbSirenFormView = new Backbone.Siren.FormView({action: bbSirenAction});
    });


    it('adds the action to the instance\'s "action" property', function () {
        expect(bbSirenFormView.action).toBeObject();
    });


    it('throws if there is no "action" property', function () {
        expect(function () {
            new Backbone.Siren.FormView({});
        }).toThrow();
    });
});

