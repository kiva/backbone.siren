/*jshint quotmark: false */
buster.spec.expose();

describe('Siren FormView: ', function () {
    'use strict';

    var sirenAction = {"name": "add-item","title": "Add Item","method": "POST","href": "http://api.x.io/orders/42/items","type": "application/x-www-form-urlencoded","fields": [{ "name": "orderNumber", "type": "hidden", "value": "42" },{ "name": "productCode", "type": "text" },{ "name": "quantity", "type": "number" }]}
    , bbSirenAction, bbSirenFormView;


    beforeEach(function () {
        bbSirenAction = new Backbone.Siren.Action(sirenAction);
        bbSirenAction.parent =  new Backbone.Siren.Model({"class": 'test', actions: [sirenAction]});
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


    it('throws if action.parent is not an instance of Backbone.Siren.Model', function () {
        expect(function () {
            new Backbone.Siren.FormView({action: {parent: new Backbone.Model({})}});
        }).toThrow();
    });


    describe('On form submit', function () {
        it('blocks the default submit and executes the form\'s siren-action', function () {
            var executeSpy = this.stub(Backbone.Siren.Action.prototype, 'execute');
            var submitSpy = this.stub(bbSirenFormView.$el[0], 'submit');

            bbSirenFormView.$el.submit();

            expect(submitSpy).not.toHaveBeenCalled();
            expect(executeSpy).toHaveBeenCalled();
        });
    });


    describe('On input element change', function () {
        it('validates the field according to the siren-action and forces the model to update', function () {
            var setSpy = this.stub(Backbone.Model.prototype, 'set');

            bbSirenFormView.$el.find('input').first().change();

            expect(setSpy).toHaveBeenCalledWith({orderNumber: "42"}, {validate: true, actionName: 'add-item', forceUpdate: true});
        });
    });
});

