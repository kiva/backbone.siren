Backbone.Siren = (function (_, Backbone, undefined) {
    'use strict';

    // The store-cache
    var _store = {}


    /**
     * Super simple store.  Good enough for now.
     *
     * @type {Object}
     * @private
     */
    , store = {

        /**
         *
         * @param {Backbone.Siren.Model} model
         * @return {Backbone.Siren.Model}
         */
        add: function (model) {
            return _store[model.url()] = model;
        }


        /**
         *
         * @param {Backbone.Siren.Model} model
         * @return {Boolean}
         */
        , exists: function (model) {
            return !!_store[model.url()];
        }


        /**
         *
         * @return {Array}
         */
        , all: function () {
            return _store;
        }
    }

    /**
     *
     * @type {Object}
     * @private
     */
    , warn = function () {
        if (Backbone.Siren.settings.showWarnings && console) {
            console.warn.apply(console, arguments);
        }
    };


    /**
     *
     * @param {Backbone.Siren.Model|Backbone.Siren.Collection} parent
     * @param actionData
     * @constructor
     */
    function Action(actionData, parent) {
        _.extend(this, actionData);
        this.parent = parent;
    }


    Action.prototype = {

        /**
         *
         * @param name
         * @return {*}
         */
        getFieldByName: function (name) {
            return _.find(this.fields, function (field) {
                return field.name == name;
            });
        }


        /**
         *
         * @param {Object} options
         * @return {$.Deferred|undefined}
         */
        , execute: function (options) {
            var attributes
            , parent = this.parent
            , presets = {
                url: this.href
                , actionName: this.name
            };

            if (! parent) {
                return;
            }

            if (this.method) {
                presets.type  = this.method;
            }

            if (this.type) {
                presets.contentType = this.type;
            }

            options = _.extend(presets, options);

            attributes = options.attributes;
            if (attributes) {
                delete options.attributes;
                attributes = _.extend(parent.getAllByAction(this.name), attributes);
            } else {
                attributes = parent.getAllByAction(this.name);
            }

            return parent.save(attributes, options);
        }
    };


    /**
     *
     * @static
     * @param name
     * @return {String}
     */
    function toCamelCase(name) {
        return name.replace(/(\-[a-z])/g, function(match){return match.toUpperCase().replace('-','');});
    }


    /**
     *
     * @static
     * @param entity
     * @return {String}
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
            url = '';
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
     * @param {Object} sirenObj Can be a siren entity or siren action object
     * @return {Array}
     */
    function getClassNames(sirenObj) {
        return sirenObj['class'] || [];
    }


    /**
     *
     * @static
     * @param {Array} entities
     * @param {Object} filters
     * @return {Array}
     */
    function filter(entities, filters) {
        return _.filter(entities, function (entity) {
            return hasProperties(entity, filters);
        });
    }


    /**
     *
     * @param {Backbone.Siren.Model|Backbone.Siren.Collection} bbSiren
     * @param {Object} filters
     * @return {Boolean}
     */
    function hasProperties(bbSiren, filters) {
        var _hasProperties = true;

        if (filters.className) {
            _hasProperties = bbSiren.hasClass(filters.className);
        }

        if (filters.rel) {
            _hasProperties = bbSiren.hasRel(filters.rel);
        }

        return _hasProperties;
    }


    /**
     *
     * @param {Object} action
     * @param {Object} filters
     * @return {Boolean}
     */
    function actionHasProperties(action, filters) {
        var hasProperties = true;

        if (filters.className) {
            hasProperties = _hasClass(action, filters.className);
        }

        if (filters.name) {
            hasProperties = action.name == filters.name;
        }

        return hasProperties;
    }


    /**
     *
     * @static
     * @param sirenObj
     * @param className
     * @return {Boolean}
     */
    function _hasClass(sirenObj, className) {
        return _.indexOf(getClassNames(sirenObj), className) > -1;
    }


    /**
     *
     * @param className
     * @return {Boolean}
     */
    function hasClass(className) {
        return _hasClass(this._data, className);
    }


    /**
     *
     * @param rel
     * @return {Boolean}
     */
    function hasRel(rel) {
        return _.indexOf(this.rels(), rel) > -1;
    }


    /**
     * Accesses the "class" property of the Siren Object
     *
     * @return {Array}
     */
    function classes() {
        return getClassNames(this._data);
    }


    /**
     *
     * @param {String} rel
     * @return {Array}
     */
    function links(rel) {
        var _links = this._data.links;

        if (rel) {
            _links = _.filter(_links, function (link) {
                return _.indexOf(link.rel, rel) > -1;
            });
        }

        return _links || [];
    }


    /**
     *
     * @param {String} rel
     * @return {Array} An array of jqXhr objects.
     */
    function request(rel) {
        var self = this
        , requests = []
        , links = this.links(rel);

        _.each(links, function (link) {
            requests.push($.getJSON(link.href, function (sirenResponse) {
                self.parseEntity(sirenResponse);
            }));
        });

        return requests;
    }


    /**
     *
     * @return {Array}
     */
    function rels() {
        return this._data.rel || [];
    }


    /**
     *
     * @static
     * @param sirenObj
     * @return {String}
     */
    function getRelAsName(sirenObj) {
        var name
        , regex = /name:(.*)/
        , relName = _.find(sirenObj.rel, function(i) {return regex.test(i);});

        if(relName) {
          name = _.last(regex.exec(relName));
        } else {
          warn('entity does not have a "name:" rel', sirenObj);
        }

        return name;
    }


    /**
     *
     * @return {String}
     */
    function name() {
        return this._data.name || getRelAsName(this._data);
    }


    /**
     *
     * @param filters
     * @return {*|Array}
     */
    function actions(filters) {
        var _actions = this._actions;

        if (filters) {
            _actions = _.filter(_actions, function (action) {
                return actionHasProperties(action, filters);
            });
        }
        return _actions;
    }


    /**
     *
     * @param {String} actionName
     * @param {Boolean} [asJson]
     * @return {Object}
     */
    function getAllByAction(actionName, asJson) {
        var values
        , action = this.getActionByName(actionName)
        , self = this;

        if (action) {
            values = {};
            _.each(action.fields, function (field) {
                var val = self instanceof Backbone.Siren.Model
                    ? self.get(field.name)
                    : self.meta(field.name);

                values[field.name] = asJson && val instanceof Backbone.Siren.Model
                    ? val.getAllByAction(field.action)
                    : val;
            });
        }

        return values;
    }


    /**
     *
     * @param {String} name
     * @return {Object|undefined}
     */
    function getActionByName(name) {
        return _.find(this._actions, function (action) {
            return action.name == name;
        });
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
     *
     * @return {Array}
     */
    function parseActions() {
        var self = this
        , _actions = [];

        _.each(self._data.actions, function (action) {
            var bbSirenAction = new Backbone.Siren.Action(action, self);

            _actions.push(bbSirenAction);

            if (action.name) {
                self[toCamelCase(action.name)] = _.bind(bbSirenAction.execute, bbSirenAction);
            } else {
                warn('Action is missing a name, unable to add top level method', action);
            }
        });

        self._actions = _actions;
        return _actions;
    }


    return {
        settings: {
            showWarnings: true
        }

        , store: store
        , warn: warn
        , Action: Action


        , Model: Backbone.Model.extend({

            url: url
            , classes: classes
            , hasClass: hasClass
            , hasRel: hasRel
            , rels: rels
            , title: title
            , actions: actions
            , links: links
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request
            , name: name


            /**
             *
             * @param {Object} sirenObj
             * @param {Object} options
             */
            , resolveEntities: function (options) {
                var self = this
                , resolvedEntities = [];

                _.each(this._data.entities, function(entity) {
                    if ((entity.href && options.autoFetch == 'linked') || options.autoFetch == 'all') {
                        resolvedEntities.push(self.fetchEntity(entity, options));
                    } else {
                        resolvedEntities.push(self.setEntity(entity, options));
                    }
                });

                return $.when(resolvedEntities).done(function () {
                    self.trigger('resolve', self);
                });
            }


            /**
             * http://backbonejs.org/#Model-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj, options) {
                this._data = sirenObj; // Stores the entire siren object in raw json
                this._entities = [];

                this.resolveEntities(options);
                this.parseActions(options);

                return sirenObj.properties;
            }


            /**
             * http://backbonejs.org/#Model-toJSON
             *
             * @param {Object} options
             */
            , toJSON: function (options) {
                var action, json = {}, self = this;

                if (options && options.actionName) {
                    action = this.getActionByName(options.actionName);
                    if (action) {
                        _.each(action.fields, function (field) {
                            var val = self instanceof Backbone.Siren.Model
                                ? self.get(field.name)
                                : self.meta(field.name);

                            json[field.name] = val instanceof Backbone.Siren.Model
                                ? val.toJSON({actionName: field.action})
                                : val;
                        });
                    }
                } else {
                    _.each(this.attributes, function (val, name) {
                        json[name] = (val instanceof Backbone.Siren.Model) || (val instanceof Backbone.Siren.Collection)
                            ? val.toJSON(options)
                            : val;
                    });
                }

                return json;
            }


            /**
             * Filters the entity's properties and returns only sub-entities
             *
             * @return {Array}
             */
            , entities: function (filters) {
                var self = this
                , entities = _.filter(this.attributes, function (val, name) {
                    return _.indexOf(self._entities, name) > -1;
                });

                if (filters) {
                    entities = filter(entities, filters);
                }

                return entities;
            }


            /**
             *
             * @param {Object} entity
             */
            , fetchEntity: function (entity) {
                var self = this;

                return Backbone.ajax({
                    url: getUrl(entity)
                    , dataType: 'json'
                    , success: function (resolvedEntity) {
                        self.setEntity(resolvedEntity);
                    }
                });
            }


            /**
             *
             * @param {Object} entity
             */
            , parseEntity: function (entity) {
                var bbSiren;

                if (_hasClass(entity, 'collection')) {
                    bbSiren = new Backbone.Siren.Collection(entity);
                } else if (_hasClass(entity, 'error')) {
                    // @todo how should we represent errors?
                    warn('@todo - errors');
                } else {
                    bbSiren = new Backbone.Siren.Model(entity);
                    store.add(bbSiren);
                }

                return bbSiren;
            }


            /**
             *
             * @param {Object} entity
             */
            , setEntity: function (entity) {
                var bbSiren = this.parseEntity(entity)
                , rel = bbSiren.name();

                this.set(rel, bbSiren);
                this._entities.push(rel);

                return bbSiren;
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

                Backbone.Model.call(this, sirenObj, options);
            }

        })


        , Collection: Backbone.Collection.extend({
            url: url
            , classes: classes
            , hasClass: hasClass
            , hasRel: hasRel
            , title: title
            , rels: rels
            , links: links
            , actions: actions
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request
            , name: name


            /**
             *
             * @param {Function|Object} arg
             * @return {Array}
             */
            , filter: function (arg) {
                if (typeof arg ==  'function') {
                    return _.filter(this, arg);
                } else {
                    return filter(this, arg);
                }
            }


            /**
             * http://backbonejs.org/#Collection-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj, options) {
                this._data = sirenObj; // Store the entire siren object in raw json
                this._meta = sirenObj.properties || {};

                var models = [];
                _.each(sirenObj.entities, function (entity) {
                    var model = new Backbone.Siren.Model(entity);
                    models.push(model);
                    store.add(model);
                });

                this.parseActions(options);

                return models;
            }


            /**
             * Unlike Models, collections don't have attributes.
             * However, there are times we need to store "meta" data about the collection such as
             * the paging "offset".
             *
             * @param {*} prop
             * @param {*} value
             * @return {Object}
             */
            , meta: function (name) {
                return this._meta[name];
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

                Backbone.Collection.call(this, sirenObj, options);
            }
        })
    };
}(_, Backbone));
