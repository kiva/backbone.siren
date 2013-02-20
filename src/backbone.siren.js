(function(root, factory) {


    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'backbone'], function(_, Backbone) {
            Backbone.Siren = factory(_, Backbone);
        });
    } else {
        // Browser globals
        root.Backbone.Siren = factory(_, Backbone);
    }

}(this, function (_, Backbone, undefined) {
    'use strict';

    function getUrl(entity) {
        var link, url;

        if (entity.href) {
            url = entity.href
        } else {
            link = entity.links.filter(function (link) {
                return !!(link.rel && link.rel.filter(function (relType) {
                    return relType == 'self';
                }).length);
            })[0];

            if (link) {
                url = link.href;
            }
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
                    var rel = el.rel;

                    rel = rel.slice(rel.lastIndexOf('/') + 1, rel.length);
                    return _.indexOf(rel, filters.rel) > -1;
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

                // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519
                options.parse = true;
                Backbone.Model.call(this, attributes, options);
            }

        })

        , Collection: Backbone.Collection.extend({
            parse: function (sirenObj) {
                this._data = sirenObj;
                return sirenObj.entities;
            }


            , url: function () {
                return getUrl(this._data);
            }


            , constructor: function (attributes, options) {
                options = options || {};

                // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519
                options.parse = true;
                Backbone.Collection.call(this, attributes, options);
            }
        })
    };

}));