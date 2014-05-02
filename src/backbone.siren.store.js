'use strict';

function newEmptySirenCollection(sirenClass, url) {
	return new Backbone.Siren.Collection({
		'class': sirenClass
		, links: [
			{
				rel: ['self'], href: url
			}
		]
	});
}


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
	 * @returns {Backbone.Siren.Store}
	 */
	, addCollection: function (collection) {
		var selfCollection
		, self = this
		, currentUrl = collection.link('current')
		, selfUrl = collection.url();

		if (currentUrl) {
			// Make sure there is a "self" collection, models should also be added there.
			selfCollection = this.get(selfUrl);
			if (! selfCollection) {
				selfCollection = newEmptySirenCollection(collection.classes(), selfUrl);
				this.data[selfUrl] = selfCollection;
			}

			selfCollection.add(collection.models);
		}

		// Add each model to the store
		collection.each(function (model) {
			self.addModel(model);
		});

		this.data[currentUrl || selfUrl] = collection;
		return this;
	}


	/**
	 *
	 * @param {Object|String} rawEntityOrUrl
	 * @returns {Backbone.Siren.Model}
	 */
	, get: function (rawEntityOrUrl) {
		/*global getRawEntityUrl*/
		return this.data[typeof rawEntityOrUrl == 'object'? getRawEntityUrl(rawEntityOrUrl, 'self'): rawEntityOrUrl];
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