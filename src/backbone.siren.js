/*global _ Backbone */

/*
 * Backbone.Siren
 *
 * Copyright (c) 2013 Kiva Microfunds
 * Licensed under the MIT license.
 * https://github.com/kiva/backbone.siren/blob/master/license.txt
 */

(function(root, factory) {
    'use strict';

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
        key: function (model) {
            return model.url() + '-' +  model.cid;
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
    }
    , warn = function (msg) {
        if (Backbone.Siren.settings.showWarnings && console) {
            console.warn(msg);
        }
    };


    /**
     *
     * @static
     * @param name
     * @param lowercaseFirstChar
     * @return {String}
     */
    function toCamelCase(name, lowercaseFirstChar) {
        return ((lowercaseFirstChar ? '' : '-') + name).replace(/(\-[a-z])/g, function(match){return match.toUpperCase().replace('-','');});
    }


    /**
     *
     * @static
     * @param entity
     * @return {Object}
     */
    function getUrl(entity) {
        var link, url;

        if (entity.href) {
            url = entity.href;
        } else if (entity.links) {
            link = entity.links.filter(function (link) {
                return !!(link.rel && link.rel.filter(function (relType) {
                    return relType == 'self';
                }).length);
            })[0];

            if (link) {
                url = link.href;
            }
        } else {
            warn('Missing href or "self" link');
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
     *
     * @static
     * @return {Array}
     */
    function getClasses(entity) {
        return entity['class'];
    }


    /**
     * Accesses the "class" property of the Siren Object
     *
     * @return {Array}
     */
    function classes() {
        return getClasses(this._data);
    }


    /**
     * By default returns characters after the last '/'.  Set to `verbose` to true to return the entire rel string.
     *
     * @param {Boolean} verbose
     * @return {String}
     */
    function rel(verbose) {
        var _rel = this._data.rel;

        if (_rel) {
            _rel = _rel[0];

            if (! verbose) {
                _rel = _rel.slice(_rel.lastIndexOf('/') + 1, _rel.length);
            }
        } else {
            warn('Missing "rel" attribute');
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

        , settings: {
            showWarnings: true
        }

        , Model: Backbone.Model.extend({

            url: url
            , classes: classes
            , rel: rel
            , title: title
            , actions: actions


            /**
             * http://backbonejs.org/#Model-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj) {
                var self = this;

                this.resolveEntities()
                    .done(function (args) {
                        _.each(args, function (entity) {
                            var camelCaseRel, model, collection;

                            if (_.indexOf(getClasses(entity), 'collection') == -1) {
                                // Its a model
                                model = new Backbone.Siren.Model(entity);
                                camelCaseRel = toCamelCase(model.rel());

                                self[camelCaseRel] = model;
                                self._entities.push(camelCaseRel);
                                store.add(model);
                            } else {
                                // Its a collection
                                collection = new Backbone.Siren.Collection(entity);
                                camelCaseRel = toCamelCase(collection.rel());

                                self[camelCaseRel] = collection;
                                self._entities.push(camelCaseRel);
                            }
                        });
                    });

                return sirenObj.properties;
            }


            /**
             * http://backbonejs.org/#Model-toJSON
             *
             * @param {Object} options
             */
            , toJSON: function () {
                var json = _.clone(this.attributes)
                , entities = this.entities();

                _.each(entities, function (entity) {
                    json[entity.rel()] = entity;
                });

                return json;
            }


            /**
             * Filters the entitie's properties and returns only sub-entities
             *
             */
            , entities: function () {
                var self = this;
                return _.filter(this, function (val, name) {
                    return _.indexOf(self._entities, name) > -1;
                });
            }


            /**
             *
             * @param {Object} options
             * @param {Boolean} options.force forces an ajax request
             * @param {Array} options.range See http://underscorejs.org/#range
             *
             * @returns {jQuery.Deferred}
             */
            , resolveEntities: function (filters, options) {
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

                    if ((entity.href || options.force) && url) {
                        deferreds.push($.getJSON(url));
                    } else if (! entity.href) {
                        deferreds.push(entity);
                    }
                });

                return $.when(deferreds);
            }


            /**
             * http://backbonejs.org/#Model-constructor
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (sirenObj, options) {
                options = options || {};
                options.parse = true; // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519

                this._data = sirenObj; // Stores the entire siren object in raw json
                this._entities = []; // Stores sub-entity models

                Backbone.Model.call(this, sirenObj, options);
            }

        })


        , Collection: Backbone.Collection.extend({
            url: url
            , classes: classes
            , title: title
            , rel: rel


            /**
             * http://backbonejs.org/#Collection-toJSON
             *
             * @param {Object} options
             */
            , toJSON: function (options) {
                return this.map(function(model){
                    return model.toJSON(options);
                });
            }


            /**
             * http://backbonejs.org/#Collection-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj) {
                var models = [];
                _.each(sirenObj.entities, function (entity) {
                    var model = new Backbone.Siren.Model(entity);
                    models.push(model);
                    store.add(model);
                });

                return models;
            }


            /**
             * http://backbonejs.org/#Collection-constructor
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (sirenObj, options) {
                options = options || {};
                options.parse = true; // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519

                this._data = sirenObj;

                Backbone.Collection.call(this, sirenObj, options);
            }
        })
    };

}));