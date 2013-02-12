Backbone.Siren = (function (_, Backbone) {
    'use strict';

    var objCache = {};


    return {
        Model:  Backbone.Model.extend({

            attributes: objCache


            , endpoint: function (url) {
                if (url) {
                    objCache[url] = {};
                }

                return objCache[url];
            }

            , fetch: function () {
                // calls Backbone.sync, signature: (method, model, options)
                // @todo Backbone.sync fires a change event when the server representation is different than the one we already have
                // Therefore seems it might make sense to always have methods fetch representations from the cache
                // (otherwise we have to synchronize the Model with the cache)
                return this.sync('read', this, {});
            }


            , classes: function () {
                var arr = [];

                for (var key in objCache) {
                    if (objCache.hasOwnProperty(key)) {
                        $.merge(arr, objCache[key]['class'] );
                    }
                }

                return arr;
            }


            , url: function() {
                var arr = [];

                for (var key in objCache) {
                    if (objCache.hasOwnProperty(key)) {
                        $.merge(arr, objCache[key].links.filter(function (link) {
                            return $.inArray(link.rel, 'self') != -1;
                        }).url);
                    }
                }

                return arr;
            }

            , actions: function () {
                var arr = [];

                for (var key in objCache) {
                    if (objCache.hasOwnProperty(key)) {
                        $.merge(arr, objCache[key].actions);
                    }
                }

                return arr;
            }

            , entity: function () {
                return this.entities(arguments)[0];
            }

            , entities: function () {
                return [1, 2, 3, 5];
            }
        })
    };

}(_, Backbone));