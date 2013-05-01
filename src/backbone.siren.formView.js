(function (_, Backbone) {
    'use strict';


    /**
     *
     * @param action
     * @param attributes
     * @return {Object}
     */
    function parseAttributes(action, attributes) {
        attributes = attributes || {};

        return {
            id: attributes.id || action.name + '-form'
            , enctype: attributes.enctype || action.type
            , method: attributes.method || action.method
            , action: attributes.action || action.href
            , title: attributes.title || action.title
            , novalidate: !attributes.validation
        };
    }


    /**
     *
     * @param action
     * @param fieldAttributes
     * @return {Object}
     */
    function parseFieldAttributes(action, fieldAttributes) {
        /*jshint maxcomplexity: 15 */ // @todo clen up this function and remove this jshint config

        fieldAttributes = fieldAttributes || {};

        var parsedFieldAttributes = {}
            , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName, parsedField, propertyValue;

            if (field.type == 'entity') {
                // @todo, how to handle the view for sub-entities...?
                console.log('@todo - how to handle sub-entity views?');
            } else if (field.type != 'entity') {
                fieldName = field.name;
                propertyValue = action.parent.get(fieldName);
                parsedField = _.extend({value: propertyValue, type: 'text'}, field, fieldAttributes[fieldName]);
                if (parsedField.type == 'checkbox') {

                    // We assume properties represented by checkboxes only have boolean values
                    parsedField.checked = parsedField.value
                        ? 'checked'
                        : '';

                    delete parsedField.value;
                } else if (parsedField.type == 'radio') {

                    // Value is an array of values, if the value matches the property's value mark it "checked"
                    if (_.isArray(parsedField.value)) {
                        parsedField.options = {};
                        _.each(parsedField.value, function (val) {
                            parsedField.options[val] = propertyValue == val
                                ? 'checked'
                                : '';
                        });
                    } else if (_.isObject(parsedField.value)) {
                        parsedField.options = [];
                        _.each(parsedField.value, function (label, name) {
                            parsedField.options.push({
                                value: name
                                , label: label
                                , checked: propertyValue == name
                                    ? 'checked'
                                    : ''
                            });
                        });
                    }
                }

                parsedField.required = parsedField.required
                    ? 'required'
                    : '';
            }

            if (parsedField) { // @todo check is temporary until nested entity rendering is working
                var fieldNameArray = fieldName.split('.');
                var pointer = parsedFieldAttributes;

                var length = fieldNameArray.length;
                _.each(fieldNameArray, function (name, index) {
                    if (! pointer[name]) {
                        if (index == length - 1) {
                            pointer[name] = parsedField;
                        } else {
                            pointer[name] = {};
                        }
                    }

                    pointer = pointer[name];
                });
            }
        });

        return parsedFieldAttributes;
    }


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormSubmit: function (event) {
            event.preventDefault();

            var self = this
            , nonModelAttributes = {};

            // Allow mapping of attribute values to designated models
            _.each(this.fieldAttributes, function (field, name) {
                var model = field.model;
                if (model) {
                    if (model instanceof Backbone.Model) {
                        nonModelAttributes[name] = model.get(name);
                    } else if (typeof model == 'function') {
                        nonModelAttributes[name] = model.call(self);
                    }
                }
            });

            this.model.getActionByName(this.action.name).execute({attributes: nonModelAttributes});
        }



        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */

            var tpl = '<% _.each(data.fieldAttributes, function (field, fieldName) { %> \
                    <div> \
                        <% if (field.label) { %><label for="<%= field.id %>"><%= field.label %></label><% } %> \
                        <% if (field.type == "radio" && _.isArray(field.value)) { %>\
                            <% _.each(field.options, function (checked, val) { %><input type="radio" name="<%= fieldName %>" value="<%= val %>"  <%= checked %> /><% }); %>\
                        <% } else if (field.type == "radio" && _.isObject(field.value)) { %>\
                            <% _.each(field.options, function (option, name) { %><input type="radio" name="<%= fieldName %>" value="<%= option.value %>"  <%= option.checked %> /><label><%= option.label %></label><% }); %>\
                        <% } else { %> \
                            <input type="<%= field.type %>" name="<%= fieldName %>" <% if (field.id) { %> id="<%= field.id %>" <% } if (field.value) { %> value="<%= field.value %>" <% } %>  <%= field.checked %> <%= field.required %> /> \
                        <% } %> \
                    </div> \
                <% }); %> <button type="submit" class="submitButton">Submit</button>';

            return  _.template(tpl, data, {variable: 'data'});
        }


        /**
         *
         * @param {Object} fieldAttributes
         * @returns {Backbone.Siren.FormView}
         */
        , setFieldAttributes: function (fieldAttributes) {
            var updatedFieldAttributes = {};

            _.each(this.fieldAttributes, function (attributes, name) {
                updatedFieldAttributes[name] = $.extend(attributes, fieldAttributes[name]);
            });

            this.fieldAttributes = updatedFieldAttributes;
            return this;
        }


        /**
         *
         * @param {Object} [options]
         * @returns {Array}
         */
        , getFieldAttributes: function () {
            return this.fieldAttributes;
        }


        /**
         * By distinguishing ._render(), we can
         *
         * @param {Object} data
         * @returns {Backbone.Siren.FormView}
         */
        , render: function () {
            var templateData = {fieldAttributes: this.fieldAttributes};
            if (this.templateHelpers) {
                _.extend(templateData, this.templateHelpers);
            }

            this.$el.html(this.template(templateData));
            return this;
        }


        /**
         * Sets the action as well as the model
         *
         * @param {Backbone.Siren.Action} action
         * @returns {Backbone.Siren.FormView}
         */
        , setAction: function (action) {
            if (! (action.parent instanceof Backbone.Siren.Model)) {
                throw 'Action object either missing required "parent" or "parent" is not a Backbone.Siren Model';
            }

            this.action = action;
            this.model = action.parent;
            return this;
        }


        /**
         * One-stop shop for setting the action, the model, and the field Attributes
         *
         * @param {Object} options
         */
        , initializeForm: function (options) {
            var action = options.action;

            if (! action) {
                throw 'Missing required property: "action"';
            }

            this.setAction(action);

            // Set the attributes manually if the view has already been instantiated
            if (this.cid) {
                this.$el.attr(parseAttributes(action, options.attributes));
            } else {
                options.attributes = parseAttributes(options.action, options.attributes);
            }

            this.fieldAttributes = parseFieldAttributes(action, options.fieldAttributes);
        }


        /**
         * Generic initialization
         */
        , initialize: function () {
            this.render();
        }


        /**
         *
         * @param {Object} options
         */
        , constructor: function (options) {
            options = options || {};
            options.validateOnChange = options.validateOnChange === undefined ? true : options.validateOnChange;

            if (options.action) {
                this.initializeForm(options);
            }

            Backbone.View.call(this, options);
        }
    });

}(_, Backbone));