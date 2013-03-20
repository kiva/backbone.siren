/*global patternLibrary */
buster.spec.expose();

describe('Siren Validate: ', function () {
    'use strict';


    var validityState = {
        valueMissing: false
        , typeMismatch: false
        , patternMismatch: false
        , tooLong: false
        , rangeUnderflow: false
        , rangeOverflow: false
        , stepMismatch: false
        , badInput: false
        , customError: false
        , valid: true
    };


    describe('._validate()', function () {
        it('overrides the default Backbone.Model.prototype._validate method, ignoring the attributes and instead validating by actionName', function () {
            this.stub(Backbone.Siren.Model.prototype, 'validate');

            var bbSirenModel = new Backbone.Siren.Model({properties: {prop1: 'uno', prop2: 'dos'}});
            bbSirenModel._validate({prop1: 'newVal'}, {validate: true, actionName: 'someAction'});

            // This is significant b/c the standard ._validate() method calls .validate() with all properties, not the actionName.
            expect(Backbone.Siren.Model.prototype.validate).toHaveBeenCalledWith('someAction', {validate: true, actionName: 'someAction'});
        });


        it('returns true on validation success and sets .validationError to null', function () {
            this.stub(Backbone.Siren.Model.prototype, 'validate').returns(undefined);

            var bbSirenModel = new Backbone.Siren.Model({properties: {prop1: 'uno', prop2: 'dos'}});
            var _validateResponse = bbSirenModel._validate({prop1: 'newVal'}, {validate: true});

            expect(_validateResponse).toBe(true);
            expect(bbSirenModel.validationError).toBe(null);
        });


        it('returns false on validation failure, sets .validationError to the ValidityState object, and fires an "invalid" event on the model', function () {
            this.stub(Backbone.Siren.Model.prototype, 'validate').returns('Validation Failed');

            var invalidHandlerSpy = this.spy();
            var options = {validate: true};
            var bbSirenModel = new Backbone.Siren.Model({properties: {prop1: 'uno', prop2: 'dos'}});

            bbSirenModel.on('invalid', invalidHandlerSpy);
            var _validateResponse = bbSirenModel._validate({prop1: 'newVal'}, options);

            expect(_validateResponse).toBe(false);
            expect(bbSirenModel.validationError).toBe('Validation Failed');
            expect(invalidHandlerSpy).toHaveBeenCalledWith(bbSirenModel, 'Validation Failed', options);
        });
    });


    describe('.validate()', function () {
        var sirenObject = {properties: {prop1: 'uno', prop2: 'dos'}, actions: [{name: 'doStuff', fields: [{name: 'prop1'}]}]};
        var bbSirenModel;

        beforeEach(function () {
            bbSirenModel = new Backbone.Siren.Model(sirenObject);
        });


        it('returns undefined if there is no error', function () {
            expect(bbSirenModel.validate('doStuff')).not.toBeDefined();
        });


        it('fails if no action is found matching the actionName (or if actionName is omitted)', function () {
            var result;

            result = bbSirenModel.validate('nonExistentAction');
            expect(result['no-actions']).toBeDefined();

            result = bbSirenModel.validate('');
            expect(result['no-actions']).toBeDefined();
        });


        it('returns an object containing a ValidityState object for each failed validation', function () {
            var result;
            var failedValidityState1 = _.extend({}, validityState, {valid: false, customError: true});

            this.stub(Backbone.Siren.Model.prototype, 'validateOne').returns(failedValidityState1);
            result = bbSirenModel.validate('doStuff');
            expect(result).toEqual({prop1: failedValidityState1});
        });
    });


    describe('.validateOne()', function () {
        var sirenObject, bbSirenModel, result;

        beforeEach(function () {
            sirenObject = {properties: {prop1: 'uno', prop2: 'dos'}, actions: [{name: 'doStuff', fields: [{name: 'prop1', required: true}]}]};
            bbSirenModel = new Backbone.Siren.Model(sirenObject);
        });

        it('returns a validation object', function () {
            result = bbSirenModel.validateOne('newVal', sirenObject.actions[0].fields[0]);
            expect(result).toEqual(validityState);
        });


        it('validates required fields; on failure sets .valueMissing = true', function () {
            result = bbSirenModel.validateOne('', sirenObject.actions[0].fields[0]);
            expect(result).toEqual(_.extend({}, validityState, {valueMissing: true, valid: false}));
        });


        it('sets .customError for any sub-entity that does not validate', function () {
            var entitiesObject = {entities:
                    [{
                        properties: {cat: 'smelly'}
                        , rel: ['pet']
                        , links: [
                            {rel: ['self'], href: 'http://someurl'}
                        ]
                        , actions: [
                            {
                                name: 'clean'
                                , fields: [{name: 'cat', type: 'text', required: true}]
                            }
                        ]
                    }]
                }
            , entityActionField = {name: 'pet', type: 'entity', action: 'clean'};

            // First we need to add the sub-entity and the action field to the parent entity (sirenObject)
            _.extend(sirenObject, entitiesObject);
            sirenObject.actions[0].fields.push(entityActionField);

            bbSirenModel = new Backbone.Siren.Model(sirenObject);
            result = bbSirenModel.validateOne(bbSirenModel.get('pet'), entityActionField);
            expect(result).toEqual(validityState);

            // Setting it undefined should fail because the field is "required"
            bbSirenModel.get('pet').set('cat', undefined);
            result = bbSirenModel.validateOne(bbSirenModel.get('pet'), entityActionField);
            expect(result).toEqual(_.extend({}, validityState, {customError: true, valid: false}));
        });
    });


    describe('.validateType()', function () {
        var sirenObject, bbSirenModel, field;

        beforeEach(function () {
            sirenObject = {properties: {prop1: 'uno', prop2: 'dos'}, actions: [{name: 'doStuff', fields: [{name: 'prop1', type: 'number'}]}]};
            field = sirenObject.actions[0].fields[0];

            Backbone.Siren.validate.setPatterns(patternLibrary);
            bbSirenModel = new Backbone.Siren.Model(sirenObject);
        });

       it('returns a partial ValidityState object, sets .typeMismatch = true on failure', function () {
           var result;

           result = bbSirenModel.validateType('notANumber', field);
           expect(result).toEqual({typeMismatch: true, valid: false});
       });


       it('warns if there is no validation rule for the field type (unless the field type is "text" or "entity")', function () {
           var warnStub = this.stub(Backbone.Siren, 'warn');

           field.type = 'invalidType';
           bbSirenModel.validateType('notANumber', field);

           expect(warnStub).toHaveBeenCalled();
       });
    });


    describe('.validateConstraints()', function () {
        var sirenObject;
        var field;
        var bbSirenModel;
        var result;

        beforeEach(function () {
            sirenObject = {properties: {prop1: 'uno', prop2: 'dos'}, actions: [{name: 'doStuff', fields: [{name: 'prop1'}]}]};
            bbSirenModel = new Backbone.Siren.Model(sirenObject);
            field = sirenObject.actions[0].fields[0];
        });


        it('returns a partial ValidityState object - an empty object when there are no errors', function () {
            var result = bbSirenModel.validateConstraints('newVal', field);
            expect(result).toEqual({});
        });


        it('sets .patternMismatch', function () {
            field.pattern = /abc/;

            result = bbSirenModel.validateConstraints('abc', field);
            expect(result).toEqual({});

            result = bbSirenModel.validateConstraints('abd', field);
            expect(result).toEqual({patternMismatch: true, valid: false});
        });


        it('sets .rangeUnderflow', function () {
            field.type = 'number';
            field.min = 10;

            result = bbSirenModel.validateConstraints(11, field);
            expect(result).toEqual({});

            result = bbSirenModel.validateConstraints(9, field);
            expect(result).toEqual({rangeUnderflow: true, valid: false});
        });


        it('sets .rangeOverflow', function () {
            field.type = 'number';
            field.max = 10;

            result = bbSirenModel.validateConstraints(9, field);
            expect(result).toEqual({});

            result = bbSirenModel.validateConstraints(11, field);
            expect(result).toEqual({rangeOverflow: true, valid: false});
        });


        it('sets .stepMismatch', function () {
            field.type = 'number';
            field.step = 3;

            result = bbSirenModel.validateConstraints(9, field);
            expect(result).toEqual({});

            result = bbSirenModel.validateConstraints(11, field);
            expect(result).toEqual({stepMismatch: true, valid: false});
        });


        it('sets .tooLong but only for some "types"', function () {
            field.type = 'number';
            field.maxlength = 10;

            result = bbSirenModel.validateConstraints('This is longer than allowed', field);
            expect(result).toEqual({});

            // Only certain types can have a maxlength, see: https://developer.mozilla.org/en-US/docs/HTML/Element/Input
            field.type = 'text';
            result = bbSirenModel.validateConstraints('This is longer than allowed', field);
            expect(result).toEqual({tooLong: true, valid: false});
        });
    });
});