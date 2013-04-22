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
     * @return {Array}
     */
    function parseFieldAttributes(action, fieldAttributes) {
        fieldAttributes = fieldAttributes || {};

        var parsedFieldAttributes = {}
        , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName;

            if (field.type != 'entity') {
                fieldName = field.name;
                parsedFieldAttributes[fieldName] = _.extend({value: getSirenProperty(action, fieldName), type: 'text'}, field, fieldAttributes[fieldName]);
                if (parsedFieldAttributes[fieldName].type == 'checkbox') {
                    if (parsedFieldAttributes[fieldName].value) {
                        parsedFieldAttributes[fieldName].bools = ['checked'];
                    }
                    delete parsedFieldAttributes[fieldName].value;
                }

                if (parsedFieldAttributes[fieldName].bools) {
                    parsedFieldAttributes[fieldName].bools = parsedFieldAttributes[fieldName].bools.join(' ');
                }
            } else if (field.type == 'entity') {
                // @todo, how to handle the view for sub-entities...?
                console.log('@todo - how to handle sub-entity views?');
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
            var $target = $(event.target);
            var data = {};
            data[$target.attr('name')] = $target.val();

            this.model.set(data, {validate: !!this.options.validateOnChange, actionName: this.action.name, forceUpdate: true});
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
                        <input type="<%= field.type %>" name="<%= fieldName %>" id="<%= field.id %>" <% if (field.value) { %> value="<%= field.value %>" <% } %>  <%= field.bools %> /> \
                    </div> \
                <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl, data, {variable: 'data'});
        }


        /**
         *
         * @param {Object} data
         */
        , parseAction: function (data) {
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
            var self= this
            , parsedData = this.parseAction(data);

            this.action = parsedData.action;
            this.fieldAttributes = parsedData.fieldAttributes;

            // Set our parsed data as top level properties to our view + pass them directly to our template
            Backbone.View.call(this, _.extend({}, data, parsedData));

            this.model.on('change', function (model, options) {
                var attrs = model.changedAttributes();

                _.each(attrs, function (value, name) {
                    self.$('[name=' + name + ']').val(value);
                });
            });

            if (this.render && this.render.toString().replace(/\s/g,'').length < 24) { // @todo hacky way to see if render has been overwritten
                this._render(parsedData);
            }
        }
    });

}(_, Backbone));