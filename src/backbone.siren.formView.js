(function (_, Backbone) {
    'use strict';


    function drillDown(namesArray, value) {
        value = value[namesArray.shift()];
        if (namesArray.length) {
            return drillDown(namesArray, value);
        } else {
            return value;
        }
    }

    function getSirenProperty(action, fieldName) {
        var namesArray = fieldName.split('.')
        , value = action.parent.get(namesArray.shift());

        if (namesArray.length && value) {
            return drillDown(namesArray, value);
        } else {
            return value;
        }
    }


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
        fieldAttributes = fieldAttributes || {};

        var parsedFieldAttributes = {}
        , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName, parsedField
            , bools = [];

            if (field.type != 'entity') {
                fieldName = field.name;
                parsedField = _.extend({value: getSirenProperty(action, fieldName), type: 'text'}, field, fieldAttributes[fieldName]);
                if (parsedField.type == 'checkbox') {
                    if (parsedField.value) {
                        bools.push('checked');
                    }
                    delete parsedField.value;
                }

                if (parsedField.required) {
                    bools.push('required');
                }

                if (bools.length) {
                    parsedField.bools = bools.join(' ');
                }
            } else if (field.type == 'entity') {
                // @todo, how to handle the view for sub-entities...?
                console.log('@todo - how to handle sub-entity views?');
            }

            if (parsedField) { // @todo check is temporary until nested entity rendering is working
                parsedFieldAttributes[fieldName] = parsedField;
            }
        });

        return parsedFieldAttributes;
    }


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
            , 'change input, select': 'handleFormElementChange'
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormSubmit: function (event) {
            event.preventDefault();
            this.model.getActionByName(this.action.name).execute();
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormElementChange: function (event) {

            /**
             * Set the encoded image as a property on the model
             *
             * @param {jQuery.Event} event
             */
            function handleFileOnLoad(event) {
                model.set(name, event.target.result);
            }

            var fileReader, data
            , $target = $(event.target)
            , name = $target.attr('name')
            , model = this.model
            , file = $target[0].files
                ? $target[0].files[0]
                : undefined;

            // Is this change event adding a file?
            if (file) {
                fileReader = new FileReader();
                fileReader.onload = handleFileOnLoad;
                fileReader.readAsDataURL(file); // @todo not supporting multiple images...yet...
            } else {
                data = {};
                data[name] = $target.val();
                model.set(data, {validate: !!this.options.validateOnChange, actionName: this.action.name, forceUpdate: true});
            }
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
                        <input type="<%= field.type %>" name="<%= fieldName %>" <% if (field.id) { %> id="<%= field.id %>" <% } if (field.value) { %> value="<%= field.value %>" <% } %>  <%= field.bools %> /> \
                    </div> \
                <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl, data, {variable: 'data'});
        }


        /**
         *
         * @param {Object} fieldAttributes
         * @returns {Backbone.Siren.FormView}
         */
        , setFieldAttributes: function (fieldAttributes) {
            var updatedFieldAttributes = {};

            _.each(this._fieldAttributes, function (attributes, name) {
                updatedFieldAttributes[name] = $.extend(attributes, fieldAttributes[name]);
            });

            this._fieldAttributes = updatedFieldAttributes;
            return this;
        }


        /**
         *
         * @param {Object} [options]
         * @returns {Array}
         */
        , getFieldAttributes: function () {
            return this._fieldAttributes;
        }


        /**
         *
         * @param {Object} data
         */
        , parseData: function (data) {
            var action;

            if (! (data && data.action)) {
                throw 'Missing required property: "action"';
            }

            action = data.action;
            if (! (action.parent instanceof Backbone.Siren.Model)) {
                throw 'Action object either missing required "parent" or "parent" is not a Backbone.Siren Model';
            }

            return {
                attributes: parseAttributes(action, data.attributes)
                , fieldAttributes: parseFieldAttributes(action, data.fieldAttributes)
                , model: action.parent
                , action: action
            };
        }


        /**
         *
         * @param {Object} data
         * @returns {Backbone.Siren.FormView}
         */
        , _render: function (data) {
            this.$el.html(this.template(data));
            return this;
        }


        /**
         *
         * @param {Object} data
         */
        , constructor: function (data) {
            data = _.extend({}, {validateOnChange: true}, data);
            var parsedData = this.parseData(data);

            this.action = parsedData.action;
            this._fieldAttributes = parsedData.fieldAttributes;

            // Set our parsed data as top level properties to our view + pass them directly to our template
            Backbone.View.call(this, _.extend({}, data, parsedData));

            if (this.render && this.render.toString().replace(/\s/g,'').length < 24) { // @todo hacky way to see if render has been overwritten
                this._render(parsedData);
            }
        }
    });

}(_, Backbone));