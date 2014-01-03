/*
* Backbone.Siren v0.3.0
*
* Copyright (c) 2014 Kiva Microfunds
* Licensed under the MIT license.
* https://github.com/kiva/backbone.siren/blob/master/license.txt
*/
(function ($, _, Backbone) {

	'use strict';
	
	/**
	 *
	 * @type {Object}
	 * @private
	 */
	var BbSiren
	, warn = function () {
	    if (BbSiren.settings.showWarnings && console) {
	        console.warn.apply(console, arguments);
	    }
	};
	
	
	/**
	 * Converts a hyphenated name to camelCase.
	 *
	 * @static
	 * @param name
	 * @returns {String}
	 */
	function toCamelCase(name) {
	    return name.replace(/(\-[a-z])/g, function(match){return match.toUpperCase().replace('-','');});
	}
	
	
	/**
	 * Gets the url from a raw Siren entity
	 *
	 * @static
	 * @param rawEntity
	 * @returns {String|undefined}
	 */
	function getRawEntityUrl(rawEntity) {
		var link, url;
	
		if (rawEntity.href) {
			url = rawEntity.href;
		} else if (rawEntity.links) {
			link = _.filter(rawEntity.links, function (link) {
				return !!(link.rel && _.filter(link.rel, function (relType) {
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
	 * Gets a raw entity's name if it was stored in the rel using the following syntax:
	 * `rel: ['name:<name>']`
	 *
	 * Note: This is probably a temporary solution as Siren does not yet officially support names on entity's.
	 *
	 * @static
	 * @param rawEntity
	 * @returns {String}
	 */
	function getRawEntityRelAsName(rawEntity) {
		var name;
	
		_.find(rawEntity.rel, function(rel) {
			name = /name:(.*)/.exec(rel);
			return name;
		});
	
		return _.last(name);
	}
	
	
	/**
	 * Gets a raw entity's name
	 *
	 * Note: Siren does not yet officially support names on entity's.
	 * There have been conversations about how to support names, once that is resolved this solution (or a better one)
	 * can be made more permanent.
	 *
	 * @static
	 * @param rawEntity
	 * @returns {String}
	 */
	function getRawEntityName(rawEntity) {
		return rawEntity.name || getRawEntityRelAsName(rawEntity);
	}
	
	
	/**
	 *
	 * @static
	 * @param {Object} rawEntity
	 * @param {String} className
	 * @returns {Boolean}
	 */
	function rawEntityHasClass(rawEntity, className) {
		return _.indexOf(rawEntity['class'], className) > -1;
	}
	
	
	/**
	 *
	 * @param classname
	 * @returns {Boolean}
	 */
	function hasClass(classname) {
		return _.indexOf(this.classes(), classname) > -1;
	}
	
	
	/**
	 *
	 * @param rel
	 * @returns {Boolean}
	 */
	function hasRel(rel) {
		return _.indexOf(this.rel(), rel) > -1;
	}
	
	
	/**
	 * Access the entity's url.
	 * In some cases this would be the "self" link, in other cases it's the "href".
	 *
	 * @returns {String}
	 */
	function url() {
		return getRawEntityUrl(this._data);
	}
	
	
	/**
	 * Accesses to the entity's "class"
	 *
	 * @returns {Array}
	 */
	function classes() {
	    return this._data['class'] || [];
	}
	
	
	/**
	 * Access to the entity's "title"
	 *
	 * @returns {String}
	 */
	function title() {
		return this._data.title;
	}
	
	
	/**
	 * Access to the entity's "rel"
	 *
	 * @returns {Array|undefined}
	 */
	function rel() {
		return this._data.rel || [];
	}
	
	
	/**
	 * Access to the entity's "links"
	 *
	 * @returns {Array|undefined}
	 */
	function links() {
	    return this._data.links || [];
	}
	
	
	/**
	 * Access to the entity's "actions"
	 *
	 * @returns {Array}
	 */
	function actions() {
		return this._actions || [];
	}
	
	
	/**
	 *
	 * @param {String} name
	 * @returns {Object|undefined}
	 */
	function getActionByName(name) {
		return _.find(this._actions, function (action) {
			return action.name == name;
		});
	}
	
	
	/**
	 * Checks if a Backbone.Siren entity matches the provided filters.
	 * Supports matching by class and/or rel.
	 *
	 * @param {Object} filters
	 * @returns {Boolean}
	 */
	function match(filters) {
		var matched = true;
	
		if (filters['class']) {
			matched = this.hasClass(filters['class']);
		}
	
		if (filters.rel) {
			matched = this.hasRel(filters.rel);
		}
	
		return matched;
	}
	
	
	/**
	 * Resolves the first link that matches the given rel
	 *
	 * @todo This only works with rel links that are requests to the API.
	 * There will be times when a rel points to a resource outside of the API and that needs to be thought through
	 * @todo This method leaves much to be desired and should be refactored.
	 *
	 * @param {String} rel
	 * @returns {Promise}
	 */
	function request(rel) {
	    // Similar to .links() only it only gives us the first "rel" match
	    var link = _.find(this._data.links, function (link) {
		    return _.indexOf(link.rel, rel) > -1;
	     });
	
	    if (! link) {
		    return;
	    }
	
	    return BbSiren.resolveOne(link.href);
	}
	
	
	/**
	 *
	 * Wrapper for .fetch(), adds the following:
	 * 1) Checks the local store
	 * 2) The deferred is resolved with the parsed Siren object
	 * 3) "sync" event is only fired once
	 *
	 * @param {Object} options
	 * @returns {Promise}
	 */
	function resolve(options) {
		options = options || {};
	
		var deferred = new $.Deferred();
	
		this.once('sync', function (bbSiren) {
			deferred.resolve(bbSiren);
		});
	
		if (options.forceFetch || !this.isLoaded) {
			this.fetch(options);
		} else if (! _.isEmpty(this._data)) {
			// Its already been hydrated
			deferred.resolve(this);
		} else if (options.url) {
			// This option allows us to defer hydration of our model or collection with the url provided
			// Very much like .fetch() only it adds support for chaining nested entities
	
			var self = this
			, chain = BbSiren.parseChain(options.url)
			, finalEntity = chain.pop();
	
			delete options.url;
	
			if (finalEntity && _.isEmpty(chain)) {
				this.resolve(_.extend(_.clone(options), {url: finalEntity, forceFetch: true})).done(function (bbSiren) {
					// Resolve the original deferred object.
					deferred.resolve(bbSiren);
				});
			} else if (finalEntity) {
				BbSiren.resolveOne(BbSiren.stringifyChain(chain), options).done(function (model) {
					// @todo %bug% model.get() might sometimes need to be collection.at()
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
	 * Given a chain, resolves the next entity in the chain
	 * @todo set this up to work with Collections (should already work if "entityName" is an id, but needs to be thoroughly tested)
	 *
	 * @param {Array} chain
	 * @param {Object} options
	 * @returns {Promise}
	 */
	function resolveNextInChain(chain, options) {
		options = options || {};
	
		var entityName, subEntity, url;
	
		if (! options.deferred) {
			options.deferred = new $.Deferred();
		}
	
		if (!_.isArray(chain) || _.isEmpty(chain)) {
			return options.deferred.resolve(this);
		}
	
		entityName = chain.shift();
		subEntity = BbSiren.isCollection(this)
			? this.at(entityName)
			: this.get(entityName);
	
		if (! subEntity) {
			throw new ReferenceError('The entity you are looking for, "' + entityName + '" is not a sub-entity at ' + this.url() + '.');
		}
	
		// Stringify the new chain array so it can be appended to the new request.
		url = BbSiren.stringifyChain(chain);
		url = url
			? subEntity.url() + '#' + url
			: subEntity.url();
	
		return BbSiren.resolveOne(url, options);
	}
	
	
	/**
	 * Is called in the Model or Collection's constructor.
	 * It creates a Backbone.Siren.Action instance from a raw action and attaches it to the Model or Collection (aka "parent").
	 *
	 * @returns {Array|undefined}
	 */
	function parseActions() {
	    var self = this
	    , _actions = [];
	
	    if (! this._data) {
		    return;
	    }
	
	    _.each(this._data.actions, function (action) {
	        var bbSirenAction = new BbSiren.Action(action, self);
	
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
	
	
	BbSiren = Backbone.Siren = function (apiRoot, options) {
		this.store = new Backbone.Siren.Store();
		this.init(apiRoot, options);
	};
	
	
	_.extend(BbSiren, {
	    settings: {
	        showWarnings: true
	    }
	    , warn: warn
	
	
		/**
		 *
		 * @param {Object} obj
		 * @returns {Boolean}
		 */
		, isHydratedObject: function (obj) {
			return !!(obj && (obj.cid || obj.models) && obj._data);
		}
	
	
		/**
		 * Is the object fully loaded or is it a partial representation?
		 *
		 * @param {Object} rawEntity
		 * @returns {Boolean}
		 */
		, isLoaded: function (rawEntity) {
			return !!(rawEntity.links && !rawEntity.href);
		}
	
	
		/**
		 *
		 * @param {Object} obj
		 * @returns {Boolean}
		 */
		, isCollection: function (obj) {
			return obj instanceof Backbone.Siren.Collection;
		}
	
	
		/**
		 *
		 * @param {Object} rawEntity
		 * @returns {Boolean}
		 */
		, isRawCollection: function (rawEntity) {
			return rawEntityHasClass(rawEntity, 'collection');
		}
	
	
		/**
		 *
		 * @param {Object} rawEntity
		 * @returns {Boolean}
		 */
		, isRawError: function (rawEntity) {
			return rawEntityHasClass(rawEntity, 'error');
		}
	
	
	    /**
	     * Creates a Backbone.Siren model, collection, or error from a Siren object
	     *
	     * @param {Object} rawEntity
	     * @returns {Backbone.Siren.Model|Backbone.Siren.Collection|Backbone.Siren.Error}
	     */
	    , parse: function (rawEntity, store) {
	        var bbSiren;
	
	        if (BbSiren.isRawCollection(rawEntity)) {
	            bbSiren = new Backbone.Siren.Collection(rawEntity, {store: store});
	        } else if (BbSiren.isRawError(rawEntity)) {
	            // @todo how should we represent errors?  For now, treat them as regular Models...
	            bbSiren = new Backbone.Siren.Model(rawEntity, {store: store});
	        } else {
	            bbSiren = new Backbone.Siren.Model(rawEntity, {store: store});
	        }
	
	        return bbSiren;
	    }
	
	
	    /**
	     * Wraps the standard Backbone.ajax()
	     *
	     * @param {String} url
	     * @returns {Promise}
	     */
	    , ajax: function (url, options) {
	        options = _.extend({url: url, dataType: 'json'}, options);
	        return Backbone.ajax(options);
	    }
	
	
	    /**
	     * Given a url string, splits it and returns an array.
	     *
	     * @param {String} str
	     * @returns {Array}
	     */
	    , parseChain: function (str) {
			if (typeof str != 'string') {
				new TypeError('Must be a string');
			}
	
			return str.replace(/^#|#$/, '').split('#');
	    }
	
	
		/**
		 * Given a chain array, joins it and returns a url string
		 *
		 * @param {Array} chain
		 * @returns {String}
		 */
		, stringifyChain: function (chain) {
			if (! _.isArray(chain)) {
				new TypeError('Must be an array');
			}
	
			return chain.join('#');
		}
	
	
		/**
		 *
		 * @param {Array|String} urls
		 * @param {Object} options
		 * @returns {Promise}
		 */
	    , resolve: function (urls, options) {
			if (_.isArray(urls)) {
				return BbSiren.resolveMany(urls, options);
			}
	
			return BbSiren.resolveOne(urls, options);
	    }
	
	
		/**
		 *
		 * @param {Array} urls
		 * @param {Object} options
		 */
		, resolveMany: function (urls, options) {
			options = options || {};
	
			var self = this
			, requestsArray = _.map(urls, function (url) {
				return self.resolveOne(url, _.clone(options));
			});
	
			return $.when.apply($, requestsArray);
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
		 * @param {Object} options.store - store instance @todo remove the need to have this parameter
		 */
		, resolveOne: function (url, options) {
			options = options || {};
	
			var store, state, deferred, storedPromise, bbSiren
			, chain = BbSiren.parseChain(url)
			, rootUrl = chain.shift()
			, chainedDeferred = options.deferred;
	
			if (options.store) {
				store = options.store;
			}
	
			if (store) {
				storedPromise = store.getRequest(rootUrl);
				if (storedPromise) {
					state = storedPromise.state();
				}
			}
	
			// The request has already been made and there are no more chained requests, we are ok use it
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
					options.deferred = chainedDeferred;
					bbSiren.resolveNextInChain(chain, options);
				});
			} else {
				if (store) {
					bbSiren = store.get(rootUrl);
				}
	
				if (bbSiren && bbSiren.isLoaded && !options.forceFetch) {
	
					// Use the stored bbSiren object
					options.deferred = chainedDeferred;
					bbSiren.resolveNextInChain(chain, options);
				} else {
					// By creating our own Deferred() we can map standard responses to bbSiren error models along each step of the chain
					deferred = new $.Deferred();
	
					if (store) {
						store.addRequest(rootUrl, deferred.promise());
					}
	
					BbSiren.ajax(rootUrl, options)
						.done(function (rawEntity) {
							var bbSiren = BbSiren.parse(rawEntity, store);
							deferred.resolve(bbSiren);
	
							options.deferred = chainedDeferred;
							bbSiren.resolveNextInChain(chain, options);
						})
						.fail(function (jqXhr) {
							var entity, bbSiren;
	
							try {
								entity = JSON.parse(jqXhr.responseText);
							} catch (exception) {
								entity = {};
							}
	
							bbSiren = BbSiren.parse(entity, store);
							deferred.reject(bbSiren, jqXhr);
							chainedDeferred.reject(bbSiren, jqXhr);
						});
				}
			}
	
			return chainedDeferred.promise();
		}
	
	    , Model: Backbone.Model.extend({
	
	        url: url
	        , classes: classes
			, rel: rel
			, actions: actions
			, links: links
			, title: title
	        , hasClass: hasClass
	        , hasRel: hasRel
	        , getActionByName: getActionByName
	        , parseActions: parseActions
			, match: match
	        , request: request
		    , resolve: resolve
			, resolveNextInChain: resolveNextInChain
	
	
	        /**
	         *
	         * @param {Object} options
	         * @returns {Promise}
	         */
	        , resolveEntities: function (options) {
	            var self = this
	            , resolvedEntities = [];
	
	            _.each(this._data.entities, function(rawEntity) {
	                resolvedEntities.push(self.resolveEntity(rawEntity, options));
	            });
	
	            return $.when(resolvedEntities).done(function () {
	                self.trigger('resolve', self);
	            });
	        }
	
	
	        /**
	         *
	         * @param {Object} rawEntity
	         * @param {Object} options
	         * @returns {Promise}
	         */
	        , resolveEntity: function (rawEntity, options) {
	            options = options || {};
	
	            var bbSiren, bbSirenPromise
	            , self = this
	            , deferred = new $.Deferred();
	
	            if ((rawEntity.href && options.autoFetch == 'linked') || options.autoFetch == 'all') {
	                BbSiren.resolveOne(getRawEntityUrl(rawEntity), options)
	                    .done(function (bbSiren) {
	                        deferred.resolve(self.setEntity(bbSiren, rawEntity.rel, getRawEntityName(rawEntity)));
	                    });
	            } else {
	                bbSiren = BbSiren.parse(rawEntity, options.store);
	                bbSirenPromise = deferred.resolve(this.setEntity(bbSiren, rawEntity.rel, getRawEntityName(rawEntity)));
	            }
	
	            return bbSirenPromise;
	        }
	
	
	        /**
	         * Sets the entity on the model
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
	         * @param {Object} rawEntity
	         */
	        , parse: function (rawEntity, options) {
	            this._data = rawEntity; // Keep a reference to the original raw siren entity
	            this._entities = [];
				this.isLoaded = BbSiren.isLoaded(rawEntity);
	
				this.resolveEntities(options);
	
				if (options.store) {
					options.store.add(this);
				}
	
	            return rawEntity.properties;
	        }
	
	
	        /**
	         * http://backbonejs.org/#Model-toJSON
	         *
	         * @param {Object} options
	         * @returns {Object}
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
	
	                    json[field.name] = BbSiren.isHydratedObject(val)
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
	         * Returns an array of all sub-entities.
	         * It filters them if a filter is provided.
	         *
	         * @param {Object} [filters]
	         * @return {Array}
	         */
	        , entities: function (filters) {
	            var entitiesArray = _.map(this._entities, function (entityItem){
	                return entityItem.entity;
	            });
	
	            if (filters) {
		            entitiesArray = _.filter(entitiesArray, function (entity) {
			            return entity.match(filters);
		            });
	            }
	
	            return entitiesArray;
	        }
	
	
		    /**
		     * Not feeling great about overriding the default implementation of .isNew(), but some non-new models may not have an id.
		     * Thus, a better indicator (at least for now) of whether a model is new might be if it has a url or not.
		     *
		     * @returns {boolean}
		     */
		    , isNew: function () {
			    return !this.url();
		    }
	
	
	        /**
	         * http://backbonejs.org/#Model-constructor
	         *
	         * @param {Object} sirenObj
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
			, rel: rel
			, actions: actions
			, links: links
			, title: title
	        , hasClass: hasClass
	        , hasRel: hasRel
	        , getActionByName: getActionByName
	        , parseActions: parseActions
			, match: match
	        , request: request
		    , resolve: resolve
			, resolveNextInChain: resolveNextInChain
	
	
	        /**
	         * http://backbonejs.org/#Collection-parse
	         *
	         * @param {Object} rawEntity
	         */
	        , parse: function (rawEntity, options) {
				options = options || {};
	
	            this._data = rawEntity; // Save a reference to the original raw entity
	            this._meta = rawEntity.properties || {};
				this.isLoaded = BbSiren.isLoaded(rawEntity);
	
	            var models = [];
	            _.each(rawEntity.entities, function (entity) {
	                models.push(new Backbone.Siren.Model(entity, options));
	            });
	
				if (options.store) {
					options.store.add(this);
				}
	
	            return models;
	        }
	
	
	        /**
	         * Unlike Models, collections don't have attributes.
	         * However, there are times we need to store "meta" data about the collection such as
	         * the paging "offset".
	         *
	         * @param {*} name
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
		     * @param {Object} attrs
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
	         * @param {Object} sirenObj
	         * @param {Object} options
	         */
	        , constructor: function (sirenObj, options) {
	            options = options || {};
	            options.parse = true; // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519
	
	            Backbone.Collection.call(this, sirenObj, options);
			    this.parseActions();
	        }
	    })
	});
	
	
	BbSiren.prototype = {
	
		/**
		 *
		 * @param {String} apiRoot
		 * @param {Object} options
		 */
		init: function (apiRoot, options) {
			this.apiRoot = apiRoot;
			this.options = options;
		}
	
	
		/**
		 * Expands an entity path into a url
		 *
		 * @param {String} entityPath
		 * @returns {String}
		 */
		, entityPathToUrl: function (entityPath) {
			return this.apiRoot + '/' + entityPath;
		}
	
	
		/**
		 * Resolves entities from the siren api
		 *
		 * @param {String|Array} entityPaths
		 * @returns {Promise}
		 */
		, resolve: function (entityPaths, options) {
			options = options || {};
			options.store = this.store;
	
			var self = this
			, urls = [];
	
			if (typeof entityPaths == 'string') {
				urls = this.entityPathToUrl(entityPaths);
			} else {
				urls = _.map(entityPaths, function(entityPath) {
					return self.entityPathToUrl(entityPath);
				});
			}
	
			return BbSiren.resolve(urls, options);
		}
	};
	
	'use strict';
	
	/**
	 *
	 * @param {Backbone.Siren.Model|Backbone.Siren.Collection} parent
	 * @param actionData
	 * @constructor
	 */
	var Action = Backbone.Siren.Action = function (actionData, parent) {
		var someModel;
	
		_.extend(this, {'class': [], method: 'GET', type: 'application/x-www-form-urlencoded'}, actionData);
	
		// WIP - Batch
		// It's implied that an empty fields array means we are using field definitions as provided by sub-entities
		// I'm calling this "nested batch".  No support yet for "inline batch"
		if (_.indexOf(this['class'], 'batch') > -1 && _.isEmpty(this.fields)) {
			someModel = parent.first();
			if (someModel) {
				this.fields = someModel.getActionByName(this.name).fields;
			}
		}
	
		this.parent = parent;
	};
	
	
	Action.prototype = {
	
		/**
		 *
		 * @param {String} classname
		 * @returns {Boolean}
		 */
		hasClass: function (classname) {
			return _.indexOf(this['class'], classname) > -1;
		}
	
	
		/**
		 * Checks if the Siren Action matches the provided filters.
		 * Supports matching by class and/or name.
		 *
		 * @param {Object} filters
		 * @returns {Boolean}
		 */
		, match: function (filters) {
			var matched = true;
	
			if (filters['class']) {
				matched = this.hasClass(filters['class']);
			}
	
			if (filters.name) {
				matched = this.name == filters.name;
			}
	
			return matched;
		}
	
	
		/**
		 *
		 * @param {String} name
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
	
			if (presets.type == 'PATCH') {
				options.patch = true;
			}
	
			// Create a temporary clone that will house all our actions related properties
			// We do this because Backbone will override our model with the response from the server
			// @todo we probably want something smarter so that we can update the model but still mitigate funky stuff from happening in the View.
			if (parent instanceof Backbone.Model) {
				actionModel = parent.clone();
				actionModel._data = parent._data;
				actionModel._actions = parent._actions;
	
				actionModel.on('request', function (model, jqXhr, options) {
					parent.trigger('request', model, jqXhr, options);
					parent.trigger('request:' + actionName, model, jqXhr, options);
				});
			} else {
				// parent is a collection, no need to clone it.
				actionModel = parent;
	
				parent.on('request', function (model, jqXhr, options) {
					parent.trigger('request:' + actionName, model, jqXhr, options);
				});
			}
	
			options = _.extend(presets, options);
			attributes = _.extend(parent.toJSON({actionName: this.name}), attributes);
	
			// Note that .save() can return false in the case of failed validation.
			jqXhr = actionModel.save(attributes, options);
	
			// Transfer any validation errors back onto the "original" model or collection.
			parent.validationError = actionModel.validationError;
	
			return jqXhr;
		}
	};
	
	'use strict';
	
	/**
	 * Stores Siren objects in memory
	 *
	 * @constructor
	 */
	var Store = Backbone.Siren.Store = function () {
		this.data = {};
		this.requests = {};
	};
	
	
	Store.prototype = {
	
		/**
		 *
		 * @param {Backbone.Siren.Model|Backbone.Siren.Collection} bbSirenObj
		 * @return {Backbone.Siren.Model}
		 */
		add: function (bbSirenObj) {
			var self = this;
	
			if (Backbone.Siren.isCollection(bbSirenObj)) {
				bbSirenObj.each(function (sirenModel) {
					self.add(sirenModel);
				});
			}
	
			this.data[bbSirenObj.url()] = bbSirenObj;
			return bbSirenObj;
		}
	
	
		/**
		 *
		 * @param {Object|String} rawEntityOrUrl
		 * @return {Backbone.Siren.Model}
		 */
		, get: function (rawEntityOrUrl) {
			/*global getRawEntityUrl*/
			return this.data[typeof rawEntityOrUrl == 'object'? getRawEntityUrl(rawEntityOrUrl): rawEntityOrUrl];
		}
	
	
		/**
		 * Filters Siren objects by their index value (aka their self-url)
		 *
		 * @param {Regex} regex
		 * @returns {Array}
		 */
		, filter: function (regex) {
			return _.filter(this.data, function (val, key) {
				return regex.test(key);
			});
		}
	
	
		/**
		 *
		 * @param {Backbone.Siren.Model|Backbone.Siren.Collection|String} ModelOrSirenObjOrUrl
		 * @return {Boolean}
		 */
		, exists: function (ModelOrSirenObjOrUrl) {
			return !!this.get(Backbone.Siren.isHydratedObject(ModelOrSirenObjOrUrl) ? ModelOrSirenObjOrUrl.url() : ModelOrSirenObjOrUrl);
		}
	
	
		/**
		 *
		 * @param url
		 * @param request
		 * @returns {Promise}
		 */
		, addRequest: function (url, request) {
			var self = this;
	
			// Remove the request from the request store once its been resolved
			request.done(function () {
				self.requests[url] = null;
			});
	
			this.requests[url] = request;
			return request;
		}
	
	
		/**
		 *
		 * @param url
		 * @returns {Promise}
		 */
		, getRequest: function (url) {
			return this.requests[url];
		}
	};
	
	/*
	
	@todo These need more work.
	
	// ../src/backbone.siren.validate.js
	
	// ../src/patternLibrary.js
	
	Backbone.Siren.validate.setPatterns(patternLibrary);
	
	// ../src/backbone.siren.errors.js
	
	*/
	
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

}(jQuery, _, Backbone));