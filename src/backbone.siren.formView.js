(function (_, Backbone) {
    'use strict';


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
            , 'change input, select': 'handleFormElementChange'
        }


        , handleFormSubmit: function (event) {
            event.preventDefault();
            this.model.getActionByName(this.action.name).execute();
        }


        , handleFormElementChange: function (event) {
            if (! this.validateOnChange) {
                return;
            }

            var $target = $(event.target);
            var data = {};
            data[$target.attr('name')] = $target.val();

            // @todo what if the parent is a collection?
            this.model.set(data);
        }


        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */
            console.log(data);
            var tpl = '<% _.each(fieldAttributes, function (field, fieldName) { %> \
                <div> \
                    <label for="<%= field.id %>"><%= field.label %></label> \
                    <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>" value="<%= field.value %>" /> \
                </div> \
            <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl)(data);
        }


        , parseAction: function (data) {
            var action, attributes, fields, dataFields, formAttributes
            , fieldAttributes = [];

            if (! (data && data.action)) {
                throw 'Missing required property: "action"';
            }

            action = data.action;
            if (! (action.parent instanceof Backbone.Model)) {
                throw 'Action object either missing required "parent" or "parent" is not a Backbone Model';
            }

            formAttributes = data.formAttributes || {};
            attributes = {
                id: formAttributes.id || action.name + '-form'
                , enctype: formAttributes.enctype || action.type
                , method: formAttributes.method || action.method
                , action: formAttributes.action || action.href
                , title: formAttributes.title || action.title
                , novalidate: !formAttributes.validation
            };

            fields = action.fields;
            _.each(fields, function (field) {
                var fieldName;

                if (field.type != 'entity') {
                    fieldName = field.name;
                    fieldAttributes.push(_.extend({value: action.parent.get(fieldName)}, field, data.fieldAttributes[fieldName]));
                } else if (field.type == 'entity') {
                    // @todo, how to handle the view for sub-entities...?
                    console.log('@todo - how to handle sub-entity views?');
                }
            });

            return {
                attributes: attributes
                , fieldAttributes: fieldAttributes
                , model: action.parent
            };
        }


        /**
         *
         * @param {Object} data
         */
        , _render: function (data) {
            return this.render(data)
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
        , constructor: function (data) {
            var parsedData = this.parseAction(data);

            Backbone.View.call(this, parsedData);
            this._render(parsedData);
            this.action = data.action;
        }

    });

}(_, Backbone));