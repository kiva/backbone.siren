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
		var self = this
		, index;

		if (Backbone.Siren.isCollection(bbSirenObj)) {
			bbSirenObj.each(function (sirenModel) {
				self.add(sirenModel);
			});

			index = bbSirenObj.link('current');
		}

		this.data[index || bbSirenObj.url()] = bbSirenObj;
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