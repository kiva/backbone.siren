Backbone.Siren = (function (_, Backbone) {
    'use strict';

    function getUrl(entity) {
        var url;

        if (entity.href) {
            url = entity.href
        } else {
            url = entity.links.filter(function (el) {
                return _.indexOf(el.rel, 'self' > -1);
            })[0].self;
        }

        return url;
    }

    return {
        Model:  Backbone.Model.extend({

            parse: function (sirenObj) {
                this._data = sirenObj;
                return sirenObj.properties;
            }


            /**
             * Accesses the "class" property of the Siren Object
             */
            , classes: function () {
                return this._data.class;
            }


            /**
             * Access to the representation's "self" url, or its "href" if there is one.
             */
            , url: function() {
                return getUrl(this._data);
            }


            /**
             * Access to the representation's "actions"
             */
            , actions: function () {
                return this._data.actions;
            }


            /**
             *
             * @param options
             * @param options.force
             * @param options.range see http://underscorejs.org/#range
             *
             * @returns {jQuery.Deferred}
             */
            , entities: function (filters, options) {
                var deferreds = []
                , entities = this._data.entities;

                // @todo Currently only have a filter for "rel"
                entities = entities.filter(function (el) {
                    return _.indexOf(el.rel, filters.rel) > -1;
                });

                if (options.range) {
                    entities = entities.slice(options.range.start, options.range.end);
                }

                _.each(entities, function (entity, index, list) {
                    var url = getUrl(entity);

                    if ((! entity.properties || options.force) && url) {
                        deferreds.push($.getJSON(url));
                    } else if (entity.properties) {
                        deferreds.push(entity);
                    }
                });

                return $.when(deferreds);
            }

            , constructor: function (attributes, options) {
                options = options || {};
                options.parse = true;
                Backbone.Model.call(this, attributes, options);
            }

        })
    };

}(_, Backbone));