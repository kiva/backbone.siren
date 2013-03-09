(function (_, Backbone) {
    'use strict';


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
         */
        , validateOne: function (/*val, field, options*/) {
            // @todo
            return '';
        }


        /**
         * See http://backbonejs.org/#Model-validate
         *
         * @param {Object} attributes
         * @param {Object} options
         */
        , validate: function (attributes, options) {
            var self = this
                , errors = this.errors = {};

            if (_.isEmpty(attributes)) {
                return errors['non-writable-fields'] = 'There were no writable fields, check your siren action. @todo better messaging';
            }

            // @todo actionName is not camelcase, unlike the action method that corresponds to the given action.  I don't think this is a big deal but it may throw some people off.
            var action = this.getActionByName(options.actionName);
            if (!action) {
                return errors['non-writable-fields'] = 'There were no writable fields, check your siren action. @todo better messaging';
            }

            _.each(attributes, function (val, name) {
                if (val instanceof Backbone.Model) {
                    // @todo iterate through and validate sub-entity actions.
                    console.log('@todo');
                } else {
                    var errorMsg = self.validateOne(val, action.getFieldByName(name), options);
                    if (errorMsg) {
                        errors[name] = errorMsg;
                    }
                }
            });

//            @todo for now, always let it validate... return errors;
        }

    });

}(_, Backbone));