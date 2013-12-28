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

		if (Backbone.Siren.isHydratedCollection(bbSirenObj)) {
			bbSirenObj.each(function (sirenModel) {
				self.add(sirenModel);
			});
		}

		this.data[bbSirenObj.url()] = bbSirenObj;
		return bbSirenObj;
	}


	/**
	 *
	 * @param {String} sirenObjOrUrl
	 * @return {Backbone.Siren.Model}
	 */
	, get: function (sirenObjOrUrl) {
		return this.data[typeof sirenObjOrUrl == 'object'? getUrl(sirenObjOrUrl): sirenObjOrUrl];
	}


	/**
	 * Filters Siren objects by their index value (aka their self-url)
	 *
	 * @param regex
	 * @returns {Array}
	 */
	, filter: function (regex) {
		return _.filter(this.data, function (val, key) {
			return regex.test(key);
		});
	}


	/**
	 *
	 * @param {Backbone.Siren.Model|Object|String} ModelOrSirenObjOrUrl
	 * @return {Boolean}
	 */
	, exists: function (ModelOrSirenObjOrUrl) {
		return !!this.get((ModelOrSirenObjOrUrl instanceof Backbone.Siren.Model)
			? ModelOrSirenObjOrUrl.url()
			: ModelOrSirenObjOrUrl);
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