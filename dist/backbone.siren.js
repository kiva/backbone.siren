/*
* Backbone.Siren v0.2.1
*
* Copyright (c) 2013 Kiva Microfunds
* Licensed under the MIT license.
* https://github.com/kiva/backbone.siren/blob/master/license.txt
*/
Backbone.Siren = (function (_, Backbone, undefined) {
    'use strict';

    // The store-cache
    var _store = {}
    , _pending = {}


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
         * @param {String} sirenObjOrUrl
         * @return {Backbone.Siren.Model}
         */
        , get: function (sirenObjOrUrl) {
            return _store[typeof sirenObjOrUrl == 'object'? getUrl(sirenObjOrUrl): sirenObjOrUrl];
        }


        /**
         *
         * @param {Backbone.Siren.Model|Object|String} ModelOrSirenObjOrUrl
         * @return {Boolean}
         */
        , exists: function (ModelOrSirenObjOrUrl) {
            return !!this.get((ModelOrSirenObjOrUrl instanceof Backbone.Siren.Model) ? ModelOrSirenObjOrUrl.url() : ModelOrSirenObjOrUrl);
        }


        /**
         *
         * @return {Array}
         */
        , all: function () {
            return _store;
        }


        , clear: function () {
            _store = {};
        }


        , addRequest: function (url, request) {
            _pending[url] = request;
        }


        , getRequest: function (url) {
            return _pending[url];
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

        // Mainly for storing properties that will need to be saved to the server but that don't live on any model.
        this.store = new Backbone.Model();
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
            options = options || {};

            var actionModel
            , attributes = options.attributes
            , actionName = this.name
            , parent = this.parent
            , presets = {
                url: this.href
                , actionName: actionName
            };

            delete options.attributes;

            if (! parent) {
                return;
            }

            if (this.method) {
                presets.type  = this.method;
            }

            if (this.type) {
                presets.contentType = this.type;
            }

            // Create a temporary clone that will house all our actions related properties
            actionModel = parent.clone();
            actionModel._data = parent._data;
            actionModel._actions = parent._actions;

            options = _.extend(presets, options);
            options.success = function (model, resp, options) {
                parent.trigger('sync:' + actionName, model, resp, options);
                parent.attributes = {};
                parent.set(actionModel.attributes);
            };

            attributes = _.extend(parent.getAllByAction(this.name), attributes);
            return actionModel.save(attributes, options);
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
     * @todo remove this? It assumes you want to fetch a link,
     * however, the link maybe be to an image, or other resource that we don't need to request, but rather just link to.
     *
     * @param {String} rel
     * @return {Array} An array of jqXhr objects.
     */
    function request(rel) {
        var requests = []
        , links = this.links(rel);

        _.each(links, function (link) {
            requests.push($.getJSON(link.href, function (sirenResponse) {
                Backbone.Siren.parseEntity(sirenResponse);
            }));
        });

        return requests;
    }


    function resolveChain(chain, options) {
        return nestedResolve(this, parseChain(chain), new $.Deferred(), options);
    }


    /**
     *
     * @return {Array}
     */
    function getRel(sirenObj) {
        return sirenObj.rel || [];
    }


    /**
     *
     * @static
     * @param sirenObj
     * @return {String}
     */
    function getRelAsName(sirenObj) {
        var name;

        _.find(getRel(sirenObj), function(rel) {
            name = /name:(.*)/.exec(rel);
            return name;
        });

        return _.last(name);
    }


    /**
     *
     * @static
     * @param sirenObj
     * @return {String}
     */
    function getName(sirenObj) {
        return sirenObj.name || getRelAsName(sirenObj);
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


    function parseChain(chain) {
        if (typeof chain == 'string') {
            chain = chain.replace(/^#|#$/, '').split('#');
        }

        return chain;
    }


    function nestedResolve(bbSiren, chain, deferred, options) {
        options = options || {};

        var entityName = chain.shift();
        var subEntity = bbSiren.get(entityName);
        if (! subEntity) {
            throw 'The entity you are looking for, "' + entityName + '" is not a sub-entity at ' + bbSiren.url() + '.';
        }

        options.deferred = deferred;
        return Backbone.Siren.resolve(subEntity.url() + '#' + chain.join('#'), options);
    }


    /**
     *
     * @param {Backbone.Siren.Model} bbSiren
     * @param {Array} chain
     * @param {Object} deferred
     * @param {Object} options
     */
    function handleRootRequest(bbSiren, chain, deferred, options) {
        if (_.isEmpty(chain)) {
            deferred.resolve(bbSiren);
        } else {
            nestedResolve(bbSiren, chain, deferred, options);
        }
    }


    return {
        settings: {
            showWarnings: true
        }

        , store: store
        , warn: warn
        , Action: Action


        /**
         * Creates a Backbone.Siren model, collection, or error from a Siren object
         *
         * @param {Object} entity
         * @returns {Backbone.Siren.Model|Backbone.Siren.Collection|Backbone.Siren.Error}
         */
        , parse: function (entity) {
            var bbSiren;

            if (_hasClass(entity, 'collection')) {
                bbSiren = new Backbone.Siren.Collection(entity);
            } else if (_hasClass(entity, 'error')) {
                // @todo how should we represent errors?
                warn('@todo - errors');
            } else {
                bbSiren = new Backbone.Siren.Model(entity);
            }

            return bbSiren;
        }


        /**
         *
         * @param {String} url
         */
        , ajax: function (url, options) {
            options = _.extend({url: url, dataType: 'json'}, options);
            return Backbone.ajax(options);
        }


        /**
         * @TODO Dire need of cleanup
         *
         * We cache bbSiren models in the store, we also cache requests to the api.
         * Caching the requests allows us asynchronous access to ALL requests not just those that have resolved.
         * This implementation needs to be revisited.  Maybe more of this logic can be moved over to the store.
         *
         * @param {String} url
         * @param {Object} options
         */
        , resolve: function resolve(url, options) {
            options = options || {};

            var chain = parseChain(url);
            var rootUrl = chain.shift();
            var chainedDeferred = options.deferred;
            var state, deferred, storedPromise, bbSiren;

            storedPromise = store.getRequest(rootUrl);
            if (storedPromise) {
                state = storedPromise.state();
            }

            // The request has already been made and we are ok to use it.
            if ((_.isEmpty(chain) && ((state == 'resolved' && !options.forceFetch) || state == 'pending'))) {
                if (chainedDeferred) {
                    return storedPromise.done(function (bbSiren) {
                        chainedDeferred.resolve(bbSiren);
                    });
                } else {
                    return storedPromise;
                }

            }

            if (! chainedDeferred) {
                chainedDeferred = new $.Deferred();
            }

            if (state == 'pending') {
                // Check for a pending request, piggy-back on it's promise if it exists.

                storedPromise.done(function (bbSiren) {
                    nestedResolve(bbSiren, chain, chainedDeferred, options);
                });
            } else {
                if (options.forceFetch || !(bbSiren = store.get(rootUrl))) {
                    deferred = new $.Deferred();
                    store.addRequest(rootUrl, deferred.promise());

                    Backbone.Siren.ajax(rootUrl, options).done(function (entity) {
                        var bbSiren = Backbone.Siren.parse(entity);
                        deferred.resolve(bbSiren);
                        handleRootRequest(bbSiren, chain, chainedDeferred, options);
                    });
                } else {
                    handleRootRequest(bbSiren, chain, chainedDeferred, options);
                }
            }

            return chainedDeferred.promise();
        }

        , Model: Backbone.Model.extend({

            url: url
            , classes: classes
            , hasClass: hasClass
            , hasRel: hasRel
            , title: title
            , actions: actions
            , links: links
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request
            , resolveChain: resolveChain


            /**
             *
             * @param {Object} sirenObj
             * @param {Object} options
             */
            , resolveEntities: function (options) {
                var self = this
                , resolvedEntities = [];

                _.each(this._data.entities, function(entity) {
                    resolvedEntities.push(self.resolveEntity(entity, options));
                });

                return $.when(resolvedEntities).done(function () {
                    self.trigger('resolve', self);
                });
            }


            /**
             * @todo this is a mess
             *
             * @param {Object} entity
             * @param {Object} options
             * @returns {$.Deferred}
             */
            , resolveEntity: function (entity, options) {
                options = options || {};

                var bbSiren, bbSirenPromise
                , self = this
                , deferred = new $.Deferred();

                if ((entity.href && options.autoFetch == 'linked') || options.autoFetch == 'all') {
                    Backbone.Siren.resolve(getUrl(entity), options)
                        .done(function (bbSiren) {
                            deferred.resolve(self.setEntity(bbSiren, getRel(entity), getName(entity)));
                        });
                } else {
                    bbSiren = Backbone.Siren.parse(entity);
                    bbSirenPromise = deferred.resolve(this.setEntity(bbSiren, getRel(entity), getName(entity)));
                }

                return bbSirenPromise;
            }


            /**
             *
             * @param {Backbone.Siren.Model} bbSiren
             * @param {Array} rel
             * @param {String} name
             * @return {Backbone.Siren.Model|Backbone.Siren.Collection|Backbone.Model.Error}
             */
            , setEntity: function (bbSiren, rel, name) {
                var entityItem = {
                    rel: rel
                    , entity: bbSiren
                };

                if (name) {
                    this.set(name, bbSiren);
                    entityItem.name = name;
                }
                this._entities.push(entityItem);

                return bbSiren;
            }


            /**
             * Wrapper for .fetch(), adds the following:
             * 1) Checks the local store
             * 2) The deferred is resolved with the parsed Siren object
             */
            , resolve: function (options) {
                options = options || {};

                var deferred = new $.Deferred();

                this.once('sync', function (bbSiren) {
                    deferred.resolve(bbSiren);
                });

                if (options.forceFetch || (this._data.href && !this._data.links)) {
                    this.fetch(options);
                } else {
                    deferred.resolve(this);
                }

                return deferred.promise();
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

                // Only store if we have the complete entity
                // According to the spec, linked entities have an href, nested entities have a "self" link.
                if (sirenObj.links && !sirenObj.href) {
                    store.add(this);
                }

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
                var entities = _.map(this._entities, function (entityItem){
                    return entityItem.entity;
                });

                if (filters) {
                    entities = filter(entities, filters);
                }

                return entities;
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
            , links: links
            , actions: actions
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request
            , resolveChain: resolveChain


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
             * @TODO fix
             *  - currently, collections do not get cached by the store
             *
             * Wrapper for .fetch(), adds the following:
             * 1) Checks the local store
             * 2) The deferred is resolved with the parsed Siren object
             */
            , resolve: function (options) {
                options = options || {};

                var deferred = new $.Deferred();

                this.once('sync', function (bbSiren) {
                    deferred.resolve(bbSiren);
                });

                if (options.forceFetch || (this._data.href && !this._data.links)) {
                    this.fetch(options);
                } else {
                    deferred.resolve(this);
                }

                return deferred.promise();
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
                    models.push(new Backbone.Siren.Model(entity));
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

(function (_, Backbone) {
    'use strict';


    Backbone.Siren.validate = {
        customPatterns: {}

        , standardPatterns: {}

        /**
         *
         * @param {Object} patterns
         */
        , setPatterns: function (patterns) {
            var self = this
            , validInputTypes = 'color date datetime datetime-local email month number range search tel time url week';

            _.each(patterns, function (pattern, name) {
                if (validInputTypes.indexOf(name) == -1) {
                    self.customPatterns[name] = pattern;
                } else {
                    self.standardPatterns[name] = pattern;
                }
            });
        }
    };


    _.extend(Backbone.Siren.Model.prototype, {


        /**
         * Override the default _validate method so we only get changed attributes instead of all attributes
         * More info: https://github.com/documentcloud/backbone/pull/1595
         *
         * @param {Object} attrs
         * @param {Object} options
         * @return {Boolean}
         * @private
         */
        _validate: function (attrs, options) {
            var error;

            // @todo @hack adding an xhr check to prevent validation of server responses
            // (Backone, .save() will call .set() on successful response from save, this set does validation, which we do not want)
            if (options.xhr || !(options.validate && this.validate)) {
                return true;
            }

            error = this.validationError = this.validate(attrs, options) || null;
            if (error) {
                this.trigger('invalid', this, error, options || {});
            }

            // @todo do we still need the forceUpdate flag?
            return !(error && !options.forceUpdate);
        }


        /**
         *
         * @param {Object} field
         */
        , validateEmptyField: function (field) {
            return field.required
                ? {valid: false, valueMissing: true}
                : {};
        }


        /**
         *
         * @param {Backbone.Siren.Model} subEntity
         * @param {Object} field
         */
        , validateSubEntity: function (subEntity, field) {
            var actionName = field.action;
            return subEntity._validate(subEntity.getAllByAction(actionName), {validate: true, actionName: actionName})
                ? {}
                : {customError: true, valid: false};
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateType: function (val, field) {
            var validity = {}
            , type = field.type
            , pattern = Backbone.Siren.validate.customPatterns[type] || Backbone.Siren.validate.standardPatterns[type];

            if (pattern) {
                if (!pattern.test(val)) {
                    validity.valid = false;
                    validity.typeMismatch = true;
                }
            }

            return validity;
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateConstraints: function (val, field) {
            var validity = {};
            var type = field.type;

            if (field.pattern && ! new RegExp(field.pattern).test(val)) {
                validity.valid = false;
                validity.patternMismatch = true;
            }

            if (type == 'number' || type == 'range') {
                if (field.min && field.min > val) {
                    validity.valid = false;
                    validity.rangeUnderflow = true;
                }

                if (field.max && field.max < val) {
                    validity.valid = false;
                    validity.rangeOverflow = true;
                }

                if (field.step && val%field.step) {
                    validity.valid = false;
                    validity.stepMismatch = true;
                }
            } else if ('text email search password tel url'.indexOf(type) > -1) {
                if (field.maxlength && field.maxlength < val.length) {
                    validity.valid = false;
                    validity.tooLong = true;
                }
            } else if (type == 'file') {
                if (field.maxSize && field.maxSize < val.length) { // @todo @hack - base64 encoded images are ~30% larger when encoded
                    validity.valid = false;
                    validity.customError = true;
                }
            }


            return validity;
        }


        /**
         *
         * @return {Object} An HTML ValidityState object https://developer.mozilla.org/en-US/docs/DOM/ValidityState
         */
        , validateOne: function (val, field /*, options*/) {
            var validity = {
                valueMissing: false
                , typeMismatch: false
                , patternMismatch: false
                , tooLong: false
                , rangeUnderflow: false
                , rangeOverflow: false
                , stepMismatch: false
                , badInput: false
                , customError: false
                , valid: true
            };

            if (!val) {
                validity = _.extend(validity, this.validateEmptyField(field));
            } else {
                _.extend(validity, this.validateType(val, field));

                if (!validity.typeMismatch) {
                    if (val instanceof Backbone.Model) {
                        _.extend(validity, this.validateSubEntity(val, field));
                    } else {
                        _.extend(validity, this.validateConstraints(val, field));
                    }

                }
            }

            return validity;
        }


        /**
         * See http://backbonejs.org/#Model-validate
         *
         * @param {Object} attributes
         * @param {Object} [options]
         * @return {Object|undefined} A keyed mapping of HTML ValidityState objects by name, undefined if there are no errors
         */
        , validate: function (attributes, options) {
            options = options || {};

            var self = this
            , actionName = options.actionName
            , action = this.getActionByName(actionName)
            , errors = {};

            if (action) {
                _.each(action.fields, function (field) {
                    var attributeName = field.name
                    , attribute = attributes[attributeName]
                    , validityState = self.validateOne(attribute, field, options);

                    if (! validityState.valid) {
                        errors[attributeName] = validityState;
                    }
                });
            } else {
                errors['no-actions'] = 'There are no actions matching the name, "' + actionName + '"';
            }

            if (! _.isEmpty(errors)) {
                return errors;
            }
        }

    });

}(_, Backbone));

/*jshint unused: false*/

// Ripped out from jquery.h5validate
var patternLibrary = {

    phone: /([\+][0-9]{1,3}([ \.\-])?)?([\(]{1}[0-9]{3}[\)])?([0-9A-Z \.\-]{1,32})((x|ext|extension)?[0-9]{1,4}?)/,

    // Shamelessly lifted from Scott Gonzalez via the Bassistance Validation plugin http://projects.scottsplayground.com/email_address_validation/
    email: /((([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?/,

    // Shamelessly lifted from Scott Gonzalez via the Bassistance Validation plugin http://projects.scottsplayground.com/iri/
    url: /(https?|ftp):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/,

    // Number, including positive, negative, and floating decimal. Credit: bassistance
    number: /-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?/,

    // Date in ISO format. Credit: bassistance
    dateISO: /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/,

    alpha: /[a-zA-Z]+/,
    alphaNumeric: /\w+/,
    integer: /-?\d+/
};

Backbone.Siren.validate.setPatterns(patternLibrary);

(function (_, Backbone) {
    'use strict';

    _.extend(Backbone.Siren.Model.prototype, {

    });

}(_, Backbone));

(function (_, Backbone) {
    'use strict';


    /**
     *
     * @param action
     * @param attributes
     * @return {Object}
     */
    function parseAttributes(action, attributes) {
        attributes = attributes || {};

        return {
            id: attributes.id || action.name + '-form'
            , enctype: attributes.enctype || action.type
            , method: attributes.method || action.method
            , action: attributes.action || action.href
            , title: attributes.title || action.title
            , novalidate: !attributes.validation
        };
    }


    /**
     *
     * @param action
     * @param fieldAttributes
     * @return {Object}
     */
    function parseFieldAttributes(action, fieldAttributes) {
        /*jshint maxcomplexity: 15 */ // @todo clen up this function and remove this jshint config

        fieldAttributes = fieldAttributes || {};

        var parsedFieldAttributes = {}
            , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName, parsedField, propertyValue;

            if (field.type == 'entity') {
                // @todo, how to handle the view for sub-entities...?
                console.log('@todo - how to handle sub-entity views?');
            } else if (field.type != 'entity') {
                fieldName = field.name;
                propertyValue = action.parent.get(fieldName);
                parsedField = _.extend({value: propertyValue, type: 'text'}, field, fieldAttributes[fieldName]);
                if (parsedField.type == 'checkbox') {

                    // We assume properties represented by checkboxes only have boolean values
                    parsedField.checked = parsedField.value
                        ? 'checked'
                        : '';

                    delete parsedField.value;
                } else if (parsedField.type == 'radio') {

                    // Value is an array of values, if the value matches the property's value mark it "checked"
                    if (_.isArray(parsedField.value)) {
                        parsedField.options = {};
                        _.each(parsedField.value, function (val) {
                            parsedField.options[val] = propertyValue == val
                                ? 'checked'
                                : '';
                        });
                    } else if (_.isObject(parsedField.value)) {
                        parsedField.options = [];
                        _.each(parsedField.value, function (label, name) {
                            parsedField.options.push({
                                value: name
                                , label: label
                                , checked: propertyValue == name
                                    ? 'checked'
                                    : ''
                            });
                        });
                    }
                }

                parsedField.required = parsedField.required
                    ? 'required'
                    : '';
            }

            if (parsedField) { // @todo check is temporary until nested entity rendering is working
                var fieldNameArray = fieldName.split('.');
                var pointer = parsedFieldAttributes;

                var length = fieldNameArray.length;
                _.each(fieldNameArray, function (name, index) {
                    if (! pointer[name]) {
                        if (index == length - 1) {
                            pointer[name] = parsedField;
                        } else {
                            pointer[name] = {};
                        }
                    }

                    pointer = pointer[name];
                });
            }
        });

        return parsedFieldAttributes;
    }


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormSubmit: function (event) {
            event.preventDefault();

            var self = this
            , nonModelAttributes = {};

            // Allow mapping of attribute values to designated models
            _.each(this.fieldAttributes, function (field, name) {
                var model = field.model;
                if (model) {
                    if (model instanceof Backbone.Model) {
                        nonModelAttributes[name] = model.get(name);
                    } else if (typeof model == 'function') {
                        nonModelAttributes[name] = model.call(self);
                    }
                }
            });

            this.model.getActionByName(this.action.name).execute({attributes: nonModelAttributes});
        }



        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */

            var tpl = '<% _.each(data.fieldAttributes, function (field, fieldName) { %> \
                    <div> \
                        <% if (field.label) { %><label for="<%= field.id %>"><%= field.label %></label><% } %> \
                        <% if (field.type == "radio" && _.isArray(field.value)) { %>\
                            <% _.each(field.options, function (checked, val) { %><input type="radio" name="<%= fieldName %>" value="<%= val %>"  <%= checked %> /><% }); %>\
                        <% } else if (field.type == "radio" && _.isObject(field.value)) { %>\
                            <% _.each(field.options, function (option, name) { %><input type="radio" name="<%= fieldName %>" value="<%= option.value %>"  <%= option.checked %> /><label><%= option.label %></label><% }); %>\
                        <% } else { %> \
                            <input type="<%= field.type %>" name="<%= fieldName %>" <% if (field.id) { %> id="<%= field.id %>" <% } if (field.value) { %> value="<%= field.value %>" <% } %>  <%= field.checked %> <%= field.required %> /> \
                        <% } %> \
                    </div> \
                <% }); %> <button type="submit" class="submitButton">Submit</button>';

            return  _.template(tpl, data, {variable: 'data'});
        }


        /**
         *
         * @param {Object} fieldAttributes
         * @returns {Backbone.Siren.FormView}
         */
        , setFieldAttributes: function (fieldAttributes) {
            var updatedFieldAttributes = {};

            _.each(this.fieldAttributes, function (attributes, name) {
                updatedFieldAttributes[name] = $.extend(attributes, fieldAttributes[name]);
            });

            this.fieldAttributes = updatedFieldAttributes;
            return this;
        }


        /**
         *
         * @param {Object} [options]
         * @returns {Array}
         */
        , getFieldAttributes: function () {
            return this.fieldAttributes;
        }


        /**
         * By distinguishing ._render(), we can
         *
         * @param {Object} data
         * @returns {Backbone.Siren.FormView}
         */
        , render: function () {
            var templateData = {fieldAttributes: this.fieldAttributes};
            if (this.templateHelpers) {
                _.extend(templateData, this.templateHelpers);
            }

            this.$el.html(this.template(templateData));
            return this;
        }


        /**
         * Sets the action as well as the model
         *
         * @param {Backbone.Siren.Action} action
         * @returns {Backbone.Siren.FormView}
         */
        , setAction: function (action) {
            if (! (action.parent instanceof Backbone.Siren.Model)) {
                throw 'Action object either missing required "parent" or "parent" is not a Backbone.Siren Model';
            }

            this.action = action;
            this.model = action.parent;
            return this;
        }


        /**
         * One-stop shop for setting the action, the model, and the field Attributes
         *
         * @param {Object} options
         */
        , initializeForm: function (options) {
            var action = options.action;

            if (! action) {
                throw 'Missing required property: "action"';
            }

            this.setAction(action);

            // Set the attributes manually if the view has already been instantiated
            if (this.cid) {
                this.$el.attr(parseAttributes(action, options.attributes));
            } else {
                options.attributes = parseAttributes(options.action, options.attributes);
            }

            this.fieldAttributes = parseFieldAttributes(action, options.fieldAttributes);
        }


        /**
         * Generic initialization
         */
        , initialize: function () {
            this.render();
        }


        /**
         *
         * @param {Object} options
         */
        , constructor: function (options) {
            options = options || {};
            options.validateOnChange = options.validateOnChange === undefined ? true : options.validateOnChange;

            if (options.action) {
                this.initializeForm(options);
            }

            Backbone.View.call(this, options);
        }
    });

}(_, Backbone));