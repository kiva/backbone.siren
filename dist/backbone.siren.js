/*
* Backbone.Siren v0.2.8
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
            _store[model.url()] = model;
        }


        /**
         *
         * @param {String} sirenObjOrUrl
         * @return {Backbone.Siren.Model}
         */
        , get: function (sirenObjOrUrl) {
            return _store[typeof sirenObjOrUrl == 'object'? getUrl(sirenObjOrUrl): sirenObjOrUrl];
        }


		, filter: function (regex) {
			return _.filter(_store, function (val, key) {
				return regex.test(key);
			});
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
	    var someModel;

	    _.extend(this, {class: [], method: 'GET', type: 'application/x-www-form-urlencoded'}, actionData);

	    // WIP - Batch
	    // It's implied that an empty fields array means we are using field definitions as provided by sub-entities
	    // I'm calling this "nested batch".  No support yet for "inline batch"
	    if (this.class.indexOf('batch') > -1 && _.isEmpty(this.fields)) {
		    someModel = parent.first();
		    if (someModel) {
			    this.fields = someModel.getActionByName(this.name).fields;
		    }
	    }

	    this.parent = parent;
    }


    Action.prototype = {

	    hasClass: function (classname) {
		    return this.class.indexOf(classname) > -1;
	    }


        /**
         *
         * @param name
         * @return {*}
         */
        , getFieldByName: function (name) {
            return _.find(this.fields, function (field) {
                return field.name == name;
            });
        }


	    /**
	     * Gets the secureKeys model.
	     *
	     * 95% of Models will not use secureKeys, so no need to have the secureKeys model added to all actions.
	     *
	     * Technically, secureKeys aren't all that inherently "secure", it's a bucket for temporarily storing security
	     * information in one spot so you can easily clear them out as soon as they are no longer needed.
	     *
	     * @returns {Backbone.Model}
	     */
	    , getSecureKeys: function () {
		    var secureKeys = this.secureKeys;
		    if (secureKeys) {
			    return secureKeys;
		    }

		    this.secureKeys = new Backbone.Model();
		    return this.secureKeys;
	    }


	    /**
	     *
	     * @param {String} name
	     * @param {String} value
	     */
	    , setSecureKey: function (name, value) {
		    var secureKeys = this.getSecureKeys();
		    secureKeys.set(name, value);
	    }


	    /**
	     *
	     * @param {String}
	     * @returns {*}
	     */
	    , getSecureKey: function (name) {
		    var secureKeys = this.secureKeys;

		    if (secureKeys) {
			    return secureKeys.get(name);
		    }
	    }


	    /**
	     * Clears all secure keys.
	     * We don't want "secure keys" floating around they should be cleared as soon as they are no longer needed
	     *
	     */
	    , clearSecureKey: function (name) {
		    return this.getSecureKeys().unset(name);
	    }


	    /**
	     * Clears all secure keys.
	     * We don't want "secure keys" floating around they should be cleared as soon as they are no longer needed
	     *
	     */
	    , clearSecureKeys: function () {
		    return this.getSecureKeys().clear();
	    }


        /**
         *
         * @param {Object} options
         * @return {$.Deferred|undefined}
         */
        , execute: function (options) {
            options = options || {};

            var actionModel, jqXhr
            , attributes = options.attributes// So you can pass in properties that do not exist in the parent.
            , actionName = this.name
            , parent = this.parent
            , presets = {
                url: this.href
                , actionName: actionName
                , success: function (model, resp, options) {
                    parent.trigger('sync:' + actionName, model, resp, options);
			        if (parent instanceof Backbone.Model) {
				        parent.attributes = {};
						parent.set(actionModel.attributes);
			        } else {
				        // Parent is assumed to be a collection
				        parent.set(actionModel.models);
			        }
                }
                , error: function (model, xhr, options) {
                    parent.trigger('error:' + actionName, model, xhr, options);
                }
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
		    // We do this because Backbone will override our model with the response from the server
		    // @todo we probably want something smarter so that we can update the model but still mitigate funky stuff from happening in the View.
		    if (parent instanceof Backbone.Model) {
			    actionModel = parent.clone();
			    actionModel._data = parent._data;
			    actionModel._actions = parent._actions;
		    } else {
			    // parent is a collection, no need to clone it.
			    actionModel = parent;
		    }

		    actionModel.on('request', function () {
			    parent.trigger('request');
			    parent.trigger('request:' + actionName);
		    });

            options = _.extend(presets, options);
            attributes = _.extend(parent.toJSON({actionName: this.name}), attributes);

		    // Note that .save() can return false in the case of failed validation.
		    jqXhr = actionModel.save(attributes, options);

		    // Transfer any validation errors back onto the "original" model or collection.
		    parent.validationError = actionModel.validationError;

		    return jqXhr;
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

	    if (!entity) {
		    return;
	    }

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


	/**
	 * @TODO fix
	 *  - currently, collections do not get cached by the store
	 *
	 * Wrapper for .fetch(), adds the following:
	 * 1) Checks the local store
	 * 2) The deferred is resolved with the parsed Siren object
	 * 3) "sync" event is only fired once
	 *
	 * @param {Object} options
	 */
	function resolve(options) {
		options = options || {};

		var deferred = new $.Deferred();

		this.once('sync', function (bbSiren) {
			deferred.resolve(bbSiren);
		});

		if (options.forceFetch || (this._data && this._data.href && !this._data.links)) {
			this.fetch(options);
		} else if (! _.isEmpty(this._data)) {
			// Its already been hydrated
			deferred.resolve(this);
		} else if (options.url) {
			// This option allows us to defer hydration of our model or collection with the url provided
			// Very much like .fetch() only it adds support for chaining nested entities

			var self = this
			, chain = Backbone.Siren.parseChain(options.url)
			, finalEntity = chain.pop();

			delete options.url;

			if (finalEntity && ! chain.length) {
				this.resolve(_.extend(_.clone(options), {url: finalEntity, forceFetch: true})).done(function (bbSiren) {
					// Resolve the original deferred object.
					deferred.resolve(bbSiren);
				});
			} else if (finalEntity) {
				Backbone.Siren.resolve(chain, options).done(function (model) {
					self.resolve(_.extend(_.clone(options), {url: model.get(finalEntity).url(), forceFetch: true})).done(function (bbSiren) {
						// Resolve the original deferred object.
						deferred.resolve(bbSiren);
					});
				});
			}
		}

		return deferred.promise();
	}


	/**
	 * Goes down the given chain and resolves all entities, relative to the current entity.
	 *
	 * @param chain
	 * @param options
	 * @returns {Promise}
	 */
    function resolveChain(chain, options) {
        return nestedResolve(this, Backbone.Siren.parseChain(chain), new $.Deferred(), options);
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
     * @return {Array|undefined}
     */
    function parseActions() {
        var self = this
        , _actions = [];

	    if (! this._data) {
		    return;
	    }

        _.each(this._data.actions, function (action) {
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
    function handleRootRequestSuccess(bbSiren, chain, deferred, options) {
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
                // @todo how should we represent errors?  For now, treat them as regular Models...
                bbSiren = new Backbone.Siren.Model(entity);
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
	     *
	     *
	     */
	    , parseChain: function (chain) {
		    if (typeof chain == 'string') {
			    chain = chain.replace(/^#|#$/, '').split('#');
		    }

		    return chain;
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

            var state, deferred, storedPromise, bbSiren
            , chain = Backbone.Siren.parseChain(url)
            , rootUrl = chain.shift()
            , chainedDeferred = options.deferred;

            storedPromise = store.getRequest(rootUrl);
            if (storedPromise) {
                state = storedPromise.state();
            }

            // The request has already been made and we are ok to use it.
            if (_.isEmpty(chain) && ((state == 'resolved' && !options.forceFetch) || state == 'pending')) {
                if (chainedDeferred) {
                    return storedPromise.done(function (bbSiren) {
                        chainedDeferred.resolve(bbSiren);
                    });
                } else {
                    return storedPromise;
                }
            }

            // We need a deferred object to track the final result of our request (bc it can be chained)
            if (! chainedDeferred) {
                chainedDeferred = new $.Deferred();
            }

            if (state == 'pending') {
                // Check for a pending request, piggy-back on it's promise if it exists.

                storedPromise.done(function (bbSiren) {
                    nestedResolve(bbSiren, chain, chainedDeferred, options);
                });
            } else {
                if (options.forceFetch || !(bbSiren = store.get(rootUrl))) { // Assign value to bbSiren

                    // By creating our own Deferred() we can map standard responses to bbSiren error models along each step of the chain
                    deferred = new $.Deferred();
                    store.addRequest(rootUrl, deferred.promise());

                    Backbone.Siren.ajax(rootUrl, options)
                        .done(function (entity) {
                            var bbSiren = Backbone.Siren.parse(entity);
                            deferred.resolve(bbSiren);
                            handleRootRequestSuccess(bbSiren, chain, chainedDeferred, options);
                        })
                        .fail(function (jqXhr) {
                            var entity = JSON.parse(jqXhr.responseText || '{}')
                            , bbSiren = Backbone.Siren.parse(entity);

                            deferred.reject(bbSiren, jqXhr);
                            chainedDeferred.reject(bbSiren, jqXhr);
                        });
                } else {
                    // Use the stored bbSiren object
                    handleRootRequestSuccess(bbSiren, chain, chainedDeferred, options);
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
            , parseActions: parseActions
            , request: request
		    , resolve: resolve
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
             * http://backbonejs.org/#Model-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj, options) {
                this._data = sirenObj; // Stores the entire siren object in raw json
                this._entities = [];

                this.resolveEntities(options);

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
                var action
	            , json = {}
	            , self = this;

                if (options && options.actionName) {
                    action = this.getActionByName(options.actionName);
                }

			    if (action) {
                    _.each(action.fields, function (field) {
                        var val = self.get(field.name);

                        json[field.name] = (val instanceof Backbone.Siren.Model || (val instanceof Backbone.Siren.Collection))
                            ? val.toJSON({actionName: field.action})
                            : val;
                    });
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
			    this.parseActions();
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
            , parseActions: parseActions
            , request: request
		    , resolve: resolve
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
             * http://backbonejs.org/#Collection-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj) {
                this._data = sirenObj; // Store the entire siren object in raw json
                this._meta = sirenObj.properties || {};

                var models = [];
                _.each(sirenObj.entities, function (entity) {
                    models.push(new Backbone.Siren.Model(entity));
                });

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
		     * Overrides the default implementation so that we can append each model's "id"
		     *
		     * @param {Object} options
		     * @returns {Object}
		     */
		    , toJSON: function (options) {
			    options  = options || {};

//			    if (! options.isNestedBatch) { // @todo WIP
//				    delete options.actionName;
//			    }

			    return this.map(function (model){
				    var jsonObj = model.toJSON(options);
				    if (options.actionName) {
					    jsonObj.id = model.id;
				    }

				    return jsonObj;
			    });
		    }


		    /**
		     * A Collection can only do POST, or GET actions.
		     *
		     * Ex:
		     * POST a new resource
		     * POST batch action (including deletion of many resources)
		     * GET many resources
		     *
		     * @param {Object} attributes
		     * @param {Object} options
		     */
		    , save: function(attrs, options) {
			    options = _.extend({validate: true}, options);

			    if (this._validate) {
					this._validate(attrs, options);
			    }

			    // After a successful server-side save, the client is (optionally)
			    // updated with the server-side state.
			    if (options.parse === undefined) {
				    options.parse = true;
			    }

			    return  this.sync('create', this, options);
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
			    this.parseActions();
            }
        })
    };
}(_, Backbone));

/*

@todo These need more work.

// ../src/backbone.siren.validate.js

// ../src/patternLibrary.js

Backbone.Siren.validate.setPatterns(patternLibrary);

// ../src/backbone.siren.errors.js

*/

(function (_, Backbone) {
    'use strict';


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , _events: {
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
                    } else if (field.isSecure) {
                        nonModelAttributes[name] = model.action.getSecureKey(name);

	                    // We don't want to store secure keys any longer than we need to.
	                    model.action.clearSecurekeys();
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
                        <% if ((field.type == "radio" || field.type == "checkbox") && _.isArray(field.value)) { %>\
                            <% _.each(field.options, function (checked, val) { %><input type="<%= field.type %>" name="<%= fieldName %>" value="<%= val %>"  <%= checked %> /><% }); %>\
                        <% } else if ((field.type == "radio" || field.type == "checkbox") && _.isObject(field.value)) { %>\
                            <% _.each(field.options, function (option, name) { %><input type="<%= field.type %>" name="<%= fieldName %>" value="<%= option.value %>"  <%= option.checked %> /><label><%= option.label %></label><% }); %>\
                        <% } else { %> \
                            <input type="<%= field.type %>" name="<%= fieldName %>" <% if (field.id) { %> id="<%= field.id %>" <% } if (field.value) { %> value="<%= field.value %>" <% } %>  <%= field.checked %> <%= field.required %> /> \
                        <% } %> \
                    </div> \
                <% }); %> <button type="submit" class="submitButton">Submit</button>';

            return  _.template(tpl, data, {variable: 'data'});
        }


        /**
         *
         * @param action
         * @param attributes
         * @return {Object}
         */
        , parseAttributes: function (action, attributes) {
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
         * @todo the function needs help!!
         *
         * @param action
         * @param fieldAttributes
         * @return {Object}
         */
        , parseFieldAttributes: function (action, fieldAttributes) {
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
                            _.each(parsedField.value, function (name, label) {
                                parsedField.options.push({
                                    value: name
                                    , label: label
                                    , checked: _.indexOf(propertyValue, name) > -1
                                        ? 'checked'
                                        : ''
                                });
                            });
                        } else if (parsedField.value) {
                            parsedField.checked = 'checked';
                        } else {
                            parsedField.checked = '';
                        }

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
                this.$el.attr(this.parseAttributes(action, options.attributes));
            } else {
                options.attributes = this.parseAttributes(options.action, options.attributes);
            }

            this.fieldAttributes = this.parseFieldAttributes(action, options.fieldAttributes);
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

            if (options.action) {
                this.initializeForm(options);
            }

            // Use _events so that events don't get overridden by child views.
            this.events = _.extend(this._events, this.events);
            Backbone.View.call(this, options);
        }
    });

}(_, Backbone));