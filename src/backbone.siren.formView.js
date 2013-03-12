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
            this.action.parent.getActionByName(this.action.name).execute();
        }


        , handleFormElementChange: function (event) {
            if (! this.validateOnChange) {
                return;
            }

            var $target = $(event.target);
            var data = {};
            data[$target.attr('name')] = $target.val();

            // @todo what if the parent is a collection?
            this.action.parent.set(data);
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
                    <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>" value="<%= field.value %>"/> \
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

            data.fields = [];
            var fields = action.fields;
            var dataFields = data.fields;
            _.each(fields, function (field) {
                if (data.fieldAttributes && field.type != 'entity') {
                    var fieldName = field.name;
                    dataFields.push(_.extend({value: action.parent.get(fieldName)}, field, data.fieldAttributes[fieldName]));
                } else if (field.type == 'entity') {
                    // @todo, how to handle the view for sub-entities...?
                    console.log('@todo - how to handle sub-entity views?');
                }
            });
            this.render(data);
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
            if (data) {
                this.validateOnChange = data.validateOnChange;
                if (data.action) {
                    this.action = data.action;
                    delete data.action;
                } else {
                    throw 'Missing required property: "action"';
                }
            }

            Backbone.View.call(this, data);
            this._render(data);
        }

    });

}(_, Backbone));