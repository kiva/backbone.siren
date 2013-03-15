(function (_, Backbone) {
    'use strict';


    Backbone.Siren.validate = {
        patterns: {}

        , inputTypes: {}

        /**
         *
         * @param {Object} patterns
         */
        , setPatterns: function (patterns) {
            var self = this
            , validInputTypes = 'color date datetime datetime-local email month number range search tel time url week';

            if (typeof patterns != 'object') {
                throw 'Argument must be an object';
            }

            _.each(patterns, function (pattern, name) {
                if (validInputTypes.indexOf(name) == -1) {
                    self.patterns[name] = pattern;
                } else {
                    self.inputTypes[name] = pattern;
                }
            });
        }
    };


    _.extend(Backbone.Siren.Model.prototype, {


        /**
         * Override the default _validate method so we only get changed attributes instead of all attributes
         * More info: https://github.com/documentcloud/backbone/pull/1595
         *
         * @param {Object} attrs
         * @param {Object} options
         * @return {Boolean}
         * @private
         */
        _validate: function (attrs, options) {
            var error;

            if (!options.validate || !this.validate) {
                return true;
            }

            // This is the line that we are removing from the default implementation
            // attrs = _.extend({}, this.attributes, attrs);
            error = this.validationError = this.validate(attrs, options) || null;
            if (!error) {
                return true;
            }

            this.trigger('invalid', this, error, options || {});
            return false;
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateType: function (val, field) {
            var validity = {}
            , patterns = Backbone.Siren.validate.inputTypes
            , pattern = patterns[field.type]; // @todo allow for additional ways of specifying validation type (?) Or are html5 types enough?

            if (pattern) {
                if (!pattern.test(val)) {
                    validity.valid = false;
                    validity.typeMismatch = true;
                }
            } else if (field.type != 'text') {
                Backbone.Siren.warn('Unrecognized input type: ' + field.type);
            }

            return validity;
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateConstraints: function (val, field) {
            var validity = {};
            var type = field.type;

            if (field.pattern && !field.pattern.test(val)) {
                validity.valid = false;
                validity.patternMismatch = true;
            }

            if (type == 'number' || type == 'range') {
                if (field.min && field.min > val) {
                    validity.valid = false;
                    validity.rangeUnderflow = true;
                }

                if (field.max && field.max < val) {
                    validity.valid = false;
                    validity.rangeOverflow = true;
                }

                if (field.step && val%field.step) {
                    validity.valid = false;
                    validity.stepMismatch = true;
                }
            } else {
                if (field.maxlength && field.maxlength < val.length) {
                    validity.valid = false;
                    validity.tooLong = true;
                }
            }


            return validity;
        }


        /**
         *
         * @return {Object} An HTML ValidityState object https://developer.mozilla.org/en-US/docs/DOM/ValidityState
         */
        , validateOne: function (val, field /*, options*/) {
            var validity = {
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

            if (!val) {
                if (field.required) {
                    validity.valid = false;
                    validity.valueMissing = true;
                }
            } else {
                _.extend(validity, this.validateType(val, field));
                _.extend(validity, this.validateConstraints(val, field));
            }

            return validity;
        }


        /**
         * See http://backbonejs.org/#Model-validate
         *
         * @param {Object} attributes
         * @param {Object} options
         * @return {Object} An keyed mapping of HTML ValidityState objects by name.
         */
        , validate: function (attributes, options) {
            var action
            , self = this
            , errors = {};

            action = this.getActionByName(options.actionName);
            if (!action) {
                errors['no-actions'] = 'Malformed Siren: There are no actions matching the name, "' + options.actionName + '"';
            } else if (_.isEmpty(attributes)) {
                errors['no-writable-fields'] = 'Malformed Siren: There were no writable fields for action "' +  options.actionName + '"';
            }

            _.each(attributes, function (val, name) {
                var field, fieldActionName, validityState, nestedErrors;

                if (val instanceof Backbone.Model) {
                    field = action.getFieldByName(name);
                    fieldActionName = field.action;

                    val._validate(val.getAllByAction(fieldActionName), {validate: true, actionName: fieldActionName});
                    nestedErrors = val.validationError;
                    if (nestedErrors) {
                        errors[name] = nestedErrors;
                    }
                } else {
                    validityState = self.validateOne(val, action.getFieldByName(name), options);
                    if (! validityState.valid) {
                        errors[name] = validityState;
                    }
                }
            });

            if (! _.isEmpty(errors)) {
                return errors;
            }
        }

    });

}(_, Backbone));