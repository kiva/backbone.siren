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

		if (!filters) {
			return matched;
		}

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