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
 * Gets a link url by name from a raw siren entity
 *
 * @param {Object} rawEntity
 * @param {String} name
 * @returns {String|undefined}
 */
function getRawEntityUrl(rawEntity, name) {
	var link, url;

	link = _.filter(rawEntity.links, function (link) {
		return !!(link.rel && _.filter(link.rel, function (relType) {
			return relType == name;
		}).length);
	})[0];

	if (link) {
		url = link.href;
	}

	return url;
}


/**
 * Gets the url from a raw Siren entity
 *
 * @static
 * @param {Object} rawEntity
 * @returns {String|undefined}
 */
function getRawEntitySelfUrl(rawEntity) {
	var url;

	if (rawEntity.href) {
		url = rawEntity.href;
	} else if (rawEntity.links) {
		url = getRawEntityUrl(rawEntity, 'self');
	} else {
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
 * @param {Object} rawEntity
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
 *
 * @param rel
 * @returns {Boolean}
 */
function hasRel(rel) {
	return _.indexOf(this.rel(), rel) > -1;
}


/**
 * Gets an entity's link by rel
 *
 * @param {String} rel
 * @returns {String|undefined}
 */
function link(rel) {
	if (rel == 'self') {
		return getRawEntitySelfUrl(this._data);
	}

	return getRawEntityUrl(this._data, rel);
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
 * Access the entity's url.
 * In some cases this would be the "self" link, in other cases it's the "href".
 *
 * @returns {String}
 */
function url() {
	return this.link('self');
}


/**
 * Given a mapping of roots to arrays of paths, swap them.
 *
 * @param {Object} roots
 * @returns {Object}
 */
function mapRoots(roots) {
	var mapped = {};
	_.each(roots, function(paths, key) {
		_.each(paths, function(path) {
			mapped[path] = key;
		});
	});
	return mapped;
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
 * @todo might be more useful if it checks if the link is to a sirenEntity? If so, resolves it? (still need to put some thought into this)
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
	options = $.extend(this.siren.ajaxOptions || {}, options);

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
 * @todo, This should probably be a public, static method on BbSiren.
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
	 * A js object is assumed to be a Siren object if it has a "self" url or top level "href".
	 *
	 * @param obj
	 * @returns {boolean}
	 */
	, isRawSiren: function (obj) {
		return !!getRawEntitySelfUrl(obj);
	}


	/**
	 *
	 * @param {Backbone.Siren.Store} store
	 * @param {Backbone.Siren.Model} model
	 */
	, addModelToStore: function (store, model) {
		store.addModel(model);
	}


	/**
	 * Adds a Collection to the store.
	 * If it's a "current" collection, it also adds the "self" collection to the store.
	 *
	 * @param {Backbone.Siren.Store} store
	 * @param {Backbone.Siren.Collection} collection
	 * @param {String} [representationToStore] limit which representation of the collection we want to store.
	 *      Can be "current" or "self".
	 */
	, addCollectionToStore: function (store, collection, representationToStore) {
		var currentUrl;

		// @todo, by having objects automatically added to the store on instantiation we end up having to pass
		// around store option.  It feels a bit messy doing things this way.  Consider re-visiting so that
		// objects no longer add themselves to the store on instantiation.
		if (representationToStore) {
			store.addCollection(collection, representationToStore);
			return;
		}

		currentUrl = collection.link('current');
		if (currentUrl) {
			store.addCollection(collection, 'current');
		}

		store.addCollection(collection, 'self');
	}


	/**
	 * Wrapper for .toJSON()
	 *
	 * @param {*} val
	 * @param {Object} options
	 * @returns {*} A serialized version of the given val.
	 */
	, serializeData: function (val, options) {
		options = options || {};

		if (BbSiren.isHydratedObject(val)) {
			if (_.indexOf(options.renderedEntities, val.url()) < 0 ) {
				return val.toJSON(options);
			}
		} else {
			return val;
		}
	}


	/**
	 * Parses a raw siren model into a Backbone.Siren.Model and maintains its representation in the store.
	 *
	 * @param {Object} rawModel
	 * @param {Object} options
	 * @returns {Backbone.Model}
	 */
	, parseModel: function (rawModel, options) {
		options = options || {};

		var model
		, store = options.store;

		if (store) {
			model = store.get(rawModel);
		}

		if (model) {
			model.update(rawModel, options);
		} else {
			model = new Backbone.Siren.Model(rawModel, options);
		}

		return model;
	}


	/**
	 * Parses a raw siren collection into a Backbone.Siren.Collection and maintains its representation in the store.
	 *
	 * @param rawCollection
	 * @param options
	 * @returns {*}
	 */
	, parseCollection: function (rawCollection, options) {
		options = options || {};

		var selfCollection, currentCollection, collection, currentUrl
		, store = options.store;

		if (store) {
			selfCollection = store.get(rawCollection);
			if (selfCollection) {
				selfCollection.update(rawCollection, options);
			} else {
				options.representationToStore = 'self';
				selfCollection = new Backbone.Siren.Collection(rawCollection, options);
			}

			// Is it a "current" collection?
			currentUrl = getRawEntityUrl(rawCollection, 'current');
			if (currentUrl) {
				currentCollection = store.get(currentUrl);

				if (currentCollection) {
					currentCollection.update(rawCollection, options);
				} else {
					options.representationToStore = 'current';
					currentCollection = new Backbone.Siren.Collection(rawCollection, options);
				}
			}

			collection = currentCollection || selfCollection;
		} else {
			collection = new Backbone.Siren.Collection(rawCollection, options);
		}

		return collection;
	}


    /**
     * Creates a Backbone.Siren model, collection, or error from a Siren object
     *
     * @param {Object} rawEntity
     * @param {Object} options
     * @returns {Backbone.Siren.Model|Backbone.Siren.Collection|Backbone.Siren.Error|undefined}
     */
    , parse: function (rawEntity, options) {
		options = options || {};

		if (BbSiren.isRawCollection(rawEntity)) {
			return this.parseCollection(rawEntity, options);
        } else if (BbSiren.isRawError(rawEntity)) {
            // @todo how should we represent errors?  For now, treat them as regular Models...
			// @todo are we storing errors in the store?  If so, don't...
            return new Backbone.Siren.Model(rawEntity, options);
        } else if (BbSiren.isRawSiren) {
			return this.parseModel(rawEntity, options);
        }
    }


    /**
     * @todo is this even being used?
     *
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
	 * @todo - Siren does not, yet, have a standard notation for referencing sub-entities / properties
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
	 * @todo - add an options.ajaxOptions parameter.
	 */
	, resolveOne: function (url, options) {
		options = options || {};


		// @todo - rootUrl should reflect the options.data object if it is set
		// See: https://github.com/kiva/backbone.siren/issues/70

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
					store.addRequest(options.data ? rootUrl + '?' + $.param(options.data) : rootUrl, deferred.promise());
				}

				BbSiren.ajax(rootUrl, options)
					.done(function (rawEntity) {
						var bbSiren = BbSiren.parse(rawEntity, options);
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

						bbSiren = BbSiren.parse(entity, options);
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
		, link: link
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
                BbSiren.resolveOne(getRawEntitySelfUrl(rawEntity), options)
                    .done(function (bbSiren) {
                        deferred.resolve(self.setEntity(bbSiren, rawEntity.rel, getRawEntityName(rawEntity)));
                    });
            } else {
                bbSiren = BbSiren.parse(rawEntity, options);
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

			// "name" is not officially supported by the siren spec. See https://github.com/kevinswiber/siren/pull/33
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

            return rawEntity.properties;
        }


        /**
         * http://backbonejs.org/#Model-toJSON
         *
         * If passed an actionName, .toJSON() will only serialize the properties from the action's field's
         *
         * @param {Object} options
         * @returns {Object}
         */
        , toJSON: function (options) {
			options = options || {};
			options.renderedEntities = options.renderedEntities || [];

            var action
            , json = {}
            , self = this;

            if (options && options.actionName) {
                action = this.getActionByName(options.actionName);
            }

			options.renderedEntities.push(this.url());

		    if (action) {
                _.each(action.fields, function (field) {
	                options.actionName = field.action;
	                json[field.name] = BbSiren.serializeData(self.get(field.name), options);
                });
            } else {
                _.each(this.attributes, function (val, name) {
	                json[name] = BbSiren.serializeData(val, options);
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
		 * Updates the model with the properties from a "rawModel"
		 *
		 * @param {Object} rawModel
		 * @param {Object} [options]
		 * @returns {Backbone.Siren.Model}
		 */
		, update: function (rawModel, options) {
			if (BbSiren.isLoaded(rawModel)) {
				this.set(this.parse(rawModel, options), options);
				this.parseActions();
			}

			return this;
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

			this.siren = {};

			if (options.store) {
				this.siren.store = options.store;
				BbSiren.addModelToStore(options.store, this);
			}

			if (options.ajaxOptions) {
				this.siren.ajaxOptions = options.ajaxOptions;
			}

		    this.parseActions();
        }

    })


    , Collection: Backbone.Collection.extend({
        url: url
        , classes: classes
		, rel: rel
		, actions: actions
		, link: link
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

			// As an optimization step, we can use the preParsedModels, otherwise, parse all the sub-entities
			var models = options.preParsedModels || _.map(rawEntity.entities, function (entity) {
                return BbSiren.parse(entity, options);
            });

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
			options = options || {};
			options.renderedEntities = options.renderedEntities || [];

			options.renderedEntities.push(this.url());

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
		 *
		 * @param {Object} rawCollection
		 * @param {Array} [models] When parsing, use these models instead of the raw models from the collection
		 */
		, update: function (rawCollection, options) {
			if (BbSiren.isLoaded(rawCollection)) {
				this.add(this.parse(rawCollection, options));
				this.parseActions();
			}

			return this;
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

			this.siren = {};

			if (options.store) {
				this.siren.store = options.store;
				BbSiren.addCollectionToStore(options.store, this, options.representationToStore);
			}

			if (options.ajaxOptions) {
				this.siren.ajaxOptions = options.ajaxOptions;
			}

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
		options = options || {};

		this.apiRoot = apiRoot;
		this.options = options;
		this.isAbsoluteRegExp = new RegExp('^(?:[a-z]+:)?//', 'i');
		this.alternateRoots = mapRoots(options.alternateRoots);
	}


	/**
	 * Expands an entity path into a url
	 *
	 * @param {String} entityPath
	 * @returns {String}
	 */
	, entityPathToUrl: function (entityPath) {
		if (this.isAbsoluteRegExp.test(entityPath)) {
			return entityPath;
		}

		return this.getRootForPath(entityPath) + '/' + entityPath;
	}


	/**
	 * Get the api root for the given path. If a root is not specified, returns the default root.
	 *
	 * @param {String} path
	 * @returns {String}
	 */
	, getRootForPath: function (path) {
		// remove parameters an anchor tags from path
		var strippedPath = path.split(/[\?#]/)[0];
		// grab the parent path
		var strippedPathParent = strippedPath.split('/')[0];
		return this.alternateRoots[strippedPath] ? this.alternateRoots[strippedPath] : this.alternateRoots[strippedPathParent] ? this.alternateRoots[strippedPathParent] : this.apiRoot;
	}


	/**
	 * Resolves entities from the siren api
	 *
	 * @param {String|Array} entityPaths
	 * @returns {Promise}
	 */
	, resolve: function (entityPaths, options) {
		options = $.extend({}, this.options, options);
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