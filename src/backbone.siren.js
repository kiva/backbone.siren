'use strict';

/**
 *
 * @type {Object}
 * @private
 */
var warn = function () {
    if (BbSiren.settings.showWarnings && console) {
        console.warn.apply(console, arguments);
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
        link = _.filter(entity.links, function (link) {
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
 * @todo Haven't had many use-cases yet for links.
 * As the use-cases arise, this method should be re-thought
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
 * Resolves the first link that matches the given rel
 *
 * @todo This only works with rel links that are requests to the API.
 * There will be times when a rel points to a resource outside of the API and that needs to be thought through
 * @todo This method leaves much to be desired and should be refactored.
 *
 * @param {String} rel
 * @return {Promise}
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
 * Given a bbSiren Model and a chain, resolves the next entity in the chain
 * @todo set this up to work with Collections (should already work if "entityName" is an id, but needs to be thoroughly tested)
 *
 * @param deferred
 * @param bbSiren
 * @param chain
 * @param options
 * @returns {Promise}
 */
function nestedResolve(deferred, bbSiren, chain, options) {
	options = options || {};

	if (! options.store) {
		options.store = bbSiren.store;
	}

	var entityName = chain[0]
	, subEntity = bbSiren.get(entityName);

	if (! subEntity) {
		throw 'The entity you are looking for, "' + entityName + '" is not a sub-entity at ' + bbSiren.url() + '.';
	}

	chain[0] = subEntity.url();

	// Stringify the new chain array so it can be appended to the new request.
	chain = BbSiren.stringifyChain(chain);
	if (chain) {
		chain = '#' + chain;
	}

	options.deferred = deferred;
	return BbSiren.resolveOne(subEntity.url() + chain, options);
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
        nestedResolve(deferred, bbSiren, chain, options);
    }
}


var BbSiren = Backbone.Siren = function (apiRoot, options) {
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
		return !!((obj.cid || obj.models) && obj._data);
	}


	/**
	 *
	 * @param {Object} obj
	 * @returns {Boolean}
	 */
	, isHydratedCollection: function (obj) {
		return obj instanceof Backbone.Siren.Collection;
	}


	/**
	 *
	 * @param {Object} obj
	 * @returns {Boolean}
	 */
	, isRawCollection: function (obj) {
		return _hasClass(obj, 'collection');
	}


	/**
	 *
	 * @param obj
	 * @returns {Boolean}
	 */
	, isRawError: function (obj) {
		return _hasClass(obj, 'error');
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
     *
     * @param {String} url
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
			new SyntaxError('Must be a string');
		}

		return str.replace(/^#|#$/, '').split('#');
    }


	/**
	 * Given a chain array, joins it and returns a url string
	 *
	 * @param chain
	 * @returns {String}
	 */
	, stringifyChain: function (chain) {
		if (! _.isArray(chain)) {
			new SyntaxError('Must be an array');
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
			return self.resolveOne(url, options);
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
				nestedResolve(chainedDeferred, bbSiren, chain, options);
			});
		} else {
			if (store) {
				bbSiren = store.get(rootUrl);
			}

			if (bbSiren && bbSiren.isLoaded && !options.forceFetch) {
				// Use the stored bbSiren object
				handleRootRequestSuccess(bbSiren, chain, chainedDeferred, options);
			} else {
				// By creating our own Deferred() we can map standard responses to bbSiren error models along each step of the chain
				deferred = new $.Deferred();

				if (store) {
					store.addRequest(rootUrl, deferred.promise());
				}

				BbSiren.ajax(rootUrl, options)
					.done(function (entity) {
						var bbSiren = BbSiren.parse(entity, store);
						deferred.resolve(bbSiren);
						handleRootRequestSuccess(bbSiren, chain, chainedDeferred, options);
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
        , hasClass: hasClass
        , hasRel: hasRel
        , title: title
        , actions: actions
        , links: links
        , getActionByName: getActionByName
        , parseActions: parseActions
        , request: request
	    , resolve: resolve


        /**
         *
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
                BbSiren.resolveOne(getUrl(entity), options)
                    .done(function (bbSiren) {
                        deferred.resolve(self.setEntity(bbSiren, getRel(entity), getName(entity)));
                    });
            } else {
                bbSiren = BbSiren.parse(entity, options.store);
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
         * @param {Object} json
         */
        , parse: function (json, options) {
            this._data = json; // Stores the entire siren object in raw json
            this._entities = [];
			this.isLoaded = !!(json.links && !json.href);

			this.resolveEntities(options);

			if (options.store) {
				options.store.add(this);
			}

            return json.properties;
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
        , hasClass: hasClass
        , hasRel: hasRel
        , title: title
        , links: links
        , actions: actions
        , getActionByName: getActionByName
        , parseActions: parseActions
        , request: request
	    , resolve: resolve


        /**
         * http://backbonejs.org/#Collection-parse
         *
         * @param {Object} json
         */
        , parse: function (json, options) {
			options = options || {};

            this._data = json; // Store the entire siren object in raw json
            this._meta = json.properties || {};
			this.isLoaded = !!(json.links && !json.href);

            var models = [];
            _.each(json.entities, function (entity) {
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
	 *
	 * @param apiRoot
	 * @param options
	 */
	init: function (apiRoot, options) {
		this.apiRoot = apiRoot;
		this.settings = options;
	}


	, entityNameToUrl: function (entityName) {
		return this.apiRoot + '/' + entityName;
	}


	/**
	 *
	 * @param {String|Array} entityNames
	 */
	, resolve: function (entityNames, options) {
		options = options || {};
		options.store = this.store;

		var self = this
		, urls = [];

		if (typeof entityNames == 'string') {
			urls = this.entityNameToUrl(entityNames);
		} else {
			urls = _.map(entityNames, function(entityName) {
				return self.entityNameToUrl(entityName);
			});
		}

		return BbSiren.resolve(urls, options);
	}
};
