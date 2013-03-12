(function (_, Backbone) {
    'use strict';


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
        }


        , handleFormSubmit: function (event) {
            event.preventDefault();
            this.action.parent.getActionByName(this.action.name).execute();
        }


        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */

            var tpl = '<% _.each(fields, function (field) { %> \
                <div> \
                    <label for="<%= field.id %>"><%= field.label %></label> \
                    <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>"/> \
                </div> \
            <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl)(data);
        }


        /**
         *
         * @param {Object} data
         */
        , _render: function (data) {
            var action = this.action;

            this.$el.attr({
                id: data.id || action.name + '-form'
                , enctype: data.enctype || action.type
                , method: data.method || action.method
                , action: data.action || action.href
                , title: data.title || action.title
                , novalidate: !data.validation
            });

            _.each(data.fieldAttributes, function (fieldAttributes, fieldName) {
                _.each(fieldAttributes, function (value, attribute) {
                    action.getFieldByName(fieldName)[attribute] = value;
                });
            });

            this.render(action);
        }

        /**
         * Override if you wanna get fancy.
         *
         * @param {Object} data
         */
        , render: function (action) {
            this.$el.html(this.template(action));
        }


        /**
         *
         * @param {Object} data
         */
        , constructor: function (data) {
            if (data.action) {
                this.action = data.action;
                delete data.action;
            } else {
                throw 'Missing required "action"';
            }

            Backbone.View.call(this, data);
            this._render(data);
        }

    });

}(_, Backbone));