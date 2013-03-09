(function (_, Backbone) {
    'use strict';


    Backbone.Siren.FormView = Backbone.View.extend({

        events: {
            'submit form': 'handleFormSubmit'
        }


        , handleFormSubmit: function (event) {
            event.preventDefault();
            this.model.getActionByName(this.options.name).execute();
            console.log('submitted!');
        }


        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */

            var tpl = '<form action="<%= href %>" id="<%= id %>"  title="<%= title %>" data-type="<%= type %>" method="<%= method %>"> \
            <% _.each(fields, function (field) { %> \
                <label for="<%= field.id %>"><%= field.label %></label> \
                <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>"/> \
            <% }); %> <input type="submit" /> </form>';


            var compiled = _.template(tpl);
            return  compiled(data);
        }


        , render: function (data) {
            var $form = $(this.template(data));
            this.$el.html($form);
        }


        , initialize: function (data) {
            this.render(data);
        }

    });

}(_, Backbone));