(function (_, Backbone) {
	'use strict';

	/**
	 *
	 * @param options
	 * @constructor
	 */
	Backbone.SirenApi = function (options) {
		var apiRoot;

		if (typeof options == 'string') {
			apiRoot = options;
		} else {
			options = options || {};

			apiRoot = options.apiRoot;
		}

		this.apiRoot = apiRoot;
	};


	Backbone.SirenApi.prototype = {
		store: Backbone.Siren.store


		/**
		 *
		 */
		, resolve: function (entityPath, options) {
			if (!this.apiRoot) {
				throw 'apiRoot not set';
			}

			if (!entityPath) {
				throw 'entityPath not set';
			}

			return Backbone.Siren.resolve(this.apiRoot + '/' + entityPath, options);
		}
	};

}(_, Backbone));