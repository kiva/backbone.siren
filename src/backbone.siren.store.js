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
	 * Adds a model to the store
	 *
	 * @param {Backbone.Siren.Model} model
	 * @returns {Backbone.Siren.Store}
	 */
	addModel: function (model) {
		this.data[model.url()] = model;
		return this;
	}


	/**
	 * Adds a collection to the store.
	 *
	 * @param {Backbone.Siren.Collection} collection
	 * @param {String} [rel="self"] - Can be "self" or "current"
	 * @returns {Backbone.Siren.Store}
	 */
	, addCollection: function (collection, rel) {
		this.data[collection.link(rel || 'self')] = collection;
		return this;
	}


	/**
	 *
	 * @param {Object|String} rawEntityOrUrl
	 * @returns {Backbone.Siren.Model|Backbone.Siren.Collection}
	 */
	, get: function (rawEntityOrUrl) {
		/*global getRawEntitySelfUrl*/
		return this.data[typeof rawEntityOrUrl == 'object'? getRawEntitySelfUrl(rawEntityOrUrl): rawEntityOrUrl];
	}


	/**
	 * Get the matching "current" collection for the given rawCollection
	 *
	 * @param {Object} rawCollection
	 * @returns {Backbone.Siren.Collection}
	 */
	, getCurrentCollection: function (rawCollection) {
		/*global BbSiren, getRawEntityUrl, getRawEntitySelfUrl */

		if (BbSiren.isLoaded(rawCollection)) {
			return this.data[getRawEntityUrl(rawCollection, 'current')];
		} else {
			// The entity is not loaded, so we don't know if it references a "current" collection or a "self" collection
			return this.data[getRawEntitySelfUrl(rawCollection)];
		}
	}


	/**
	 * Filters Siren objects by their index value (aka their self-url)
	 *
	 * @param {String} regexString
	 * @returns {Array}
	 */
	, filter: function (regexString) {
		var regex = new RegExp(regexString);
		return _.filter(this.data, function (val, key) {
			return regex.test(key);
		});
	}


	/**
	 *
	 * @param {Backbone.Siren.Model|Backbone.Siren.Collection|String} ModelOrSirenObjOrUrl
	 * @returns {Boolean}
	 */
	, exists: function (ModelOrSirenObjOrUrl) {
		return !!this.get(Backbone.Siren.isHydratedObject(ModelOrSirenObjOrUrl) ? ModelOrSirenObjOrUrl.url() : ModelOrSirenObjOrUrl);
	}


	/**
	 *
	 * @param url
	 * @param request
	 * @returns {Backbone.Siren.Store}
	 */
	, addRequest: function (url, request) {
		var self = this;

		// Remove the request from the request store once its been resolved
		request.done(function () {
			self.requests[url] = null;
		});

		this.requests[url] = request;
		return this;
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