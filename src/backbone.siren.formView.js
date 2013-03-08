(function (_, Backbone) {
    'use strict';


    Backbone.Siren.FormView = Backbone.View.extend({

        template: function (data) {
            /*jshint multistr:true */

            var tpl = '<form action="<%= href %>"  title="<%= title %>" data-type="<%= type %>" method="<%= method %>"> \
            <% _.each(fields, function (field) { %> \
                <label for="<%= field.id %>"><%= field.label %></label> \
                <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>"/> \
            <% }); %> </form>';


            var compiled = _.template(tpl);
            return  compiled(data);
        }


        , render: function (data) {
            var html = this.template(data);
            this.$el.html(html);
        }


        , initialize: function (data) {
            this.render(data);
        }

    });

}(_, Backbone));