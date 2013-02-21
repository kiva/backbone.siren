(function(root, factory) {


    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'backbone', 'backbone-relational'], function(_, Backbone) {
            Backbone.Siren = factory(_, Backbone);
        });
    } else {
        // Browser globals
        root.Backbone.Siren = factory(_, Backbone);
    }

}(this, function (_, Backbone, undefined) {
    'use strict';

    // The store
    var _store = {}
    , store = {
        _store: {}

        , key: function (model) {
            return model.rel() + model.cid;
        }

        , add: function (model) {
            _store[this.key(model)] = model;
        }

        , exists: function (model) {
            return !!_store[this.key(model)];
        }

        , all: function () {
            return _store;
        }
    };


    /**
     *
     * @param name
     * @param lowercaseFirstChar
     * @return {String}
     */
    function toCamelCase(name, lowercaseFirstChar) {
        return ((lowercaseFirstChar ? '' : '-') + name).replace(/(\-[a-z])/g, function(match){return match.toUpperCase().replace('-','');});
    }


    /**
     *
     * @param entity
     * @return {Object}
     */
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


    /**
     * Access to the representation's "self" url, or its "href" if there is one.
     *
     * @return {String}
     */
    function url() {
        return getUrl(this._data);
    }


    /**
     * Accesses the "class" property of the Siren Object
     *
     * @return {Array}
     */
    function classes() {
        return this._data.class;
    }


    /**
     *
     * @param {Boolean} verbose By default returns characters after the last '/'.  Set to true to pass the entire rel string.
     * @return {String}
     */
    function rel(verbose) {
        var _rel = this._data.rel[0];

        if (! verbose) {
            _rel = _rel.slice(_rel.lastIndexOf('/') + 1, _rel.length);
        }

        return _rel;
    }


    /**
     * Access to the representation's "title"
     *
     * @return {String}
     */
    function title() {
        return this._data.title;
    }


    /**
     * Access to the representation's "actions"
     *
     * @return {Array}
     */
    function actions() {
        return this._data.actions;
    }


    return {
        store: store

        , Model: Backbone.Model.extend({

            url: url
            , classes: classes
            , rel: rel
            , title: title
            , actions: actions


            /**
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj) {
                this._data = sirenObj;

                var self = this;


                var entities = this.entities();
                entities.done(function (args) {
                    _.each(args, function (entity, index) {
                        var model = new Backbone.Siren.Model(entity);
                        store.add(model);
                    })
                });


                return sirenObj.properties;
            }


            /**
             *
             * @param {Object} options
             * @param {Boolean} options.force forces an ajax request
             * @param {Array} options.range See http://underscorejs.org/#range
             *
             * @returns {jQuery.Deferred}
             */
            , entities: function (filters, options) {
                options = options || {};

                var deferreds = []
                , entities = this._data.entities;

                if (filters) {
                    // @todo Currently only have a filter for "rel"
                    entities = entities.filter(function (el) {
                        var rel = el.rel;

                        rel = rel.slice(rel.lastIndexOf('/') + 1, rel.length);
                        return _.indexOf(rel, filters.rel) > -1;
                    });
                }

                if (options.range) {
                    entities = entities.slice(options.range[0], options.range[1]);
                }

                _.each(entities, function (entity) {
                    var url = getUrl(entity);

                    if ((! entity.properties || options.force) && url) {
                        deferreds.push($.getJSON(url));
                    } else if (entity.properties) {
                        deferreds.push(entity);
                    }
                });

                return $.when(deferreds);
            }


            /**
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (attributes, options) {
                options = options || {};

                // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519
                options.parse = true;
                Backbone.Model.call(this, attributes, options);
            }

        })


        , Collection: Backbone.Collection.extend({

            url: url
            , classes: classes
            , title: title


            /**
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj) {
                this._data = sirenObj;
                return sirenObj.entities;
            }


            /**
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (attributes, options) {
                options = options || {};

                // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519
                options.parse = true;
                Backbone.Collection.call(this, attributes, options);
            }
        })
    };

}));