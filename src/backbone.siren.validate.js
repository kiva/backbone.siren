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

            if (! (options.validate && this.validate)) {
                return true;
            }

            error = this.validationError = this.validate(attrs, options) || null;
            if (error) {
                this.trigger('invalid', this, error, options || {});
            }

            // @todo do we still need the forceUpdate flag?
            return !(error && !options.forceUpdate);
        }


        /**
         *
         * @param {Object} field
         */
        , validateEmptyField: function (field) {
            return field.required
                ? {valid: false, valueMissing: true}
                : {};
        }


        /**
         *
         * @param {Backbone.Siren.Model} subEntity
         * @param {Object} field
         */
        , validateSubEntity: function (subEntity, field) {
            var actionName = field.action;
            return subEntity._validate(subEntity.getAllByAction(actionName), {validate: true, actionName: actionName})
                ? {}
                : {customError: true, valid: false};
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateType: function (val, field) {
            var validity = {}
            , type = field.type
            , pattern = Backbone.Siren.validate.customPatterns[type] || Backbone.Siren.validate.standardPatterns[type];

            if (pattern) {
                if (!pattern.test(val)) {
                    validity.valid = false;
                    validity.typeMismatch = true;
                }
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

            if (field.pattern && ! new RegExp(field.pattern).test(val)) {
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
            } else if ('text email search password tel url'.indexOf(type) > -1) {
                if (field.maxlength && field.maxlength < val.length) {
                    validity.valid = false;
                    validity.tooLong = true;
                }
            } else if (type == 'file') {
                if (field.maxSize && field.maxSize < val.length) { // @todo @hack - base64 encoded images are ~30% larger when encoded
                    validity.valid = false;
                    validity.customError = true;
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
                validity = _.extend(validity, this.validateEmptyField(field));
            } else {
                _.extend(validity, this.validateType(val, field));

                if (!validity.typeMismatch) {
                    if (val instanceof Backbone.Model) {
                        _.extend(validity, this.validateSubEntity(val, field));
                    } else {
                        _.extend(validity, this.validateConstraints(val, field));
                    }

                }
            }

            return validity;
        }


        /**
         * See http://backbonejs.org/#Model-validate
         *
         * @param {Object} attributes
         * @param {Object} [options]
         * @return {Object|undefined} A keyed mapping of HTML ValidityState objects by name, undefined if there are no errors
         */
        , validate: function (attributes, options) {
            options = options || {};

            var self = this
            , actionName = options.actionName
            , action = this.getActionByName(actionName)
            , errors = {};

            if (action) {
                _.each(action.fields, function (field) {
                    var attributeName = field.name
                    , attribute = attributes[attributeName]
                    , validityState = self.validateOne(attribute, field, options);

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