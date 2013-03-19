(function (_, Backbone) {
    'use strict';


    Backbone.Siren.validate = {
        customPatterns: {}

        , standardPatterns: {}

        /**
         *
         * @param {Object} patterns
         */
        , setPatterns: function (patterns) {
            var self = this
            , validInputTypes = 'color date datetime datetime-local email month number range search tel time url week';

            _.each(patterns, function (pattern, name) {
                if (validInputTypes.indexOf(name) == -1) {
                    self.customPatterns[name] = pattern;
                } else {
                    self.standardPatterns[name] = pattern;
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

            // We are also removing the "attributes" parameter and only passing in an options parameter
            error = this.validationError = this.validate(options.actionName, options) || null;
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
            , pattern = Backbone.Siren.validate.customPatterns[field.customType] || Backbone.Siren.validate.standardPatterns[field.type];

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

                if (!validity.typeMismatch) {
                    if (val instanceof Backbone.Model) {
                        if (! val._validate({}, {validate: true, actionName: field.action})) {
                            validity.customError = true;
                            validity.valid = false;
                        }
                    } else {
                        _.extend(validity, this.validateConstraints(val, field));
                    }

                }
            }

            return validity;
        }


        /**
         * See http://backbonejs.org/#Model-validate
         * Note that we are changing the signature and passing in an "actionName" instead of attribute values.
         * This is because passing in attribute values is redundant, being that the "action" already knows what attributes
         * to validate.
         *
         * @param {String} actionName
         * @param {Object} [options]
         * @return {Object|undefined} A keyed mapping of HTML ValidityState objects by name, undefined if there are no errors
         */
        , validate: function (actionName, options) {
            options = options || {};

            var action
            , self = this
            , errors = {};

            action = this.getActionByName(actionName);
            if (action) {
                _.each(action.fields, function (field) {
                    var attributeName = field.name
                    , validityState = self.validateOne(self.get(attributeName), field, options);

                    if (! validityState.valid) {
                        errors[attributeName] = validityState;
                    }
                });
            } else {
                errors['no-actions'] = 'There are no actions matching the name, "' + actionName + '"';
            }

            if (! _.isEmpty(errors)) {
                return errors;
            }
        }

    });

}(_, Backbone));