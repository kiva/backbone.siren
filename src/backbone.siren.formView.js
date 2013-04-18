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
        var namesArray = fieldName.split('_')
        , value = action.parent.get(namesArray.shift());

        if (namesArray.length) {
            return drillDown(namesArray, value);
        } else {
            return value;
        }
    }


    /**
     *
     * @param action
     * @param formAttributes
     * @return {Object}
     */
    function parseFormAttributes(action, formAttributes) {
        formAttributes = formAttributes || {};

        return {
            id: formAttributes.id || action.name + '-form'
            , enctype: formAttributes.enctype || action.type
            , method: formAttributes.method || action.method
            , action: formAttributes.action || action.href
            , title: formAttributes.title || action.title
            , novalidate: !formAttributes.validation
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

        var parsedFieldAttributes = []
        , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName;

            if (field.type != 'entity') {
                fieldName = field.name;
                parsedFieldAttributes.push(_.extend({value: getSirenProperty(action, fieldName), type: "text"}, field, fieldAttributes[fieldName]));
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

            var tpl = '<% _.each(fieldAttributes, function (field, fieldName) { %> \
                <div> \
                    <label for="<%= field.id %>"><%= field.label %></label> \
                    <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>" value="<%= field.value %>" /> \
                </div> \
            <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl)(data);
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
                attributes: parseFormAttributes(action, data.formAttributes)
                , fieldAttributes: parseFieldAttributes(action, data.fieldAttributes)
                , model: action.parent
                , action: action
            };
        }


        /**
         * Override if you wanna get fancy.
         *
         * @param {Object} data
         */
        , render: function (data) {
            return this.$el.html(this.template(data));
        }


        /**
         *
         * @param {Object} data
         */
        , _render: function (data) {
            return this.render(data);
        }


        /**
         *
         * @param {Object} data
         */
        , constructor: function (data) {
            data = _.extend({}, data, {validateOnChange: true});
            var parsedData = this.parseAction(data);

            // Set our parsed data as top level properties to our view + pass them directly to our template
            Backbone.View.call(this, _.extend({}, data, parsedData));
            this.action = parsedData.action;
            this._render(parsedData);
        }

    });

}(_, Backbone));