/*
* Backbone.Siren v0.0.5
*
* Copyright (c) 2013 Kiva Microfunds
* Licensed under the MIT license.
* https://github.com/kiva/backbone.siren/blob/master/license.txt
*/
Backbone.Siren = (function (_, Backbone, undefined) {
    'use strict';

    // The store-cache
    var _store = {}


    /**
     * Super simple store.  Good enough for now.
     *
     * @type {Object}
     * @private
     */
    , store = {

        /**
         *
         * @param {Backbone.Siren.Model} model
         * @return {Backbone.Siren.Model}
         */
        add: function (model) {
            return _store[model.url()] = model;
        }


        /**
         *
         * @param {Backbone.Siren.Model} model
         * @return {Boolean}
         */
        , exists: function (model) {
            return !!_store[model.url()];
        }


        /**
         *
         * @return {Array}
         */
        , all: function () {
            return _store;
        }
    }

    /**
     *
     * @type {Object}
     * @private
     */
    , warn = function () {
        if (Backbone.Siren.settings.showWarnings && console) {
            console.warn.apply(console, arguments);
        }
    };


    /**
     *
     * @param {Backbone.Siren.Model|Backbone.Siren.Collection} parent
     * @param actionData
     * @constructor
     */
    function Action(actionData, parent) {
        _.extend(this, actionData);
        this.parent = parent;
    }


    Action.prototype = {

        /**
         *
         * @param name
         * @return {*}
         */
        getFieldByName: function (name) {
            return _.find(this.fields, function (field) {
                return field.name == name;
            });
        }


        /**
         *
         * @param {Object} options
         * @return {$.Deferred|undefined}
         */
        , execute: function (options) {
            if (! this.parent) {
                return;
            }

            var defaults = {
                url: this.href
                , actionName: this.name
                , method: this.method
                , type: this.type
                , validate: true
                , patch: true
                , content: 'application/vnd.siren+json'
            };

            options = _.extend(defaults, options);
            return this.parent.save(this.parent.getAllByAction(this.name), options);
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

        if (entity.href) {
            url = entity.href;
        } else if (entity.links) {
            link = entity.links.filter(function (link) {
                return !!(link.rel && link.rel.filter(function (relType) {
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
            _hasProperties = bbSiren.rel() == filters.rel;
        }

        return _hasProperties;
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
     * Accesses the "class" property of the Siren Object
     *
     * @return {Array}
     */
    function classes() {
        return getClassNames(this._data);
    }


    /**
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
     *
     * @param {String} rel
     * @return {Array} An array of jqXhr objects.
     */
    function request(rel) {
        var self = this
        , requests = []
        , links = this.links(rel);

        _.each(links, function (link) {
            requests.push($.getJSON(link.href, function (sirenResponse) {
                self.parseEntity(sirenResponse);
            }));
        });

        return requests;
    }


    /**
     *
     * @static
     * @param sirenObj
     * @return {String}
     */
    function getRel(sirenObj) {
        var rel = sirenObj.rel;

        if (rel) {
            rel = rel[0]; // @todo, arbitrarily grabbing the first rel might be bad but I still don't understand the use case for many rels...
            rel = rel.slice(rel.lastIndexOf('/') + 1, rel.length);
        }

        return rel;
    }


    /**
     *
     * @return {String}
     */
    function rel() {
        return getRel(this._data);
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
     * @param {String} actionName
     * @return {Object}
     */
    function getAllByAction(actionName) {
        var values
        , action = this.getActionByName(actionName)
        , self = this;

        if (action) {
            values = {};
            _.each(action.fields, function (field) {
                if (self instanceof Backbone.Model) {
                    values[field.name] = self.get(field.name);
                } else {
                    values[field.name] = self.meta(field.name);
                }

            });
        }

        return values;
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
     * @return {Array}
     */
    function parseActions() {
        var self = this
        , _actions = [];

        _.each(self._data.actions, function (action) {
            var bbSirenAction = new Backbone.Siren.Action(action, self);

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


    return {
        settings: {
            showWarnings: true
        }

        , store: store
        , warn: warn
        , Action: Action


        , Model: Backbone.Model.extend({

            url: url
            , classes: classes
            , hasClass: hasClass
            , rel: rel
            , title: title
            , actions: actions
            , links: links
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request


            /**
             *
             * @param {Object} sirenObj
             * @param {Object} options
             */
            , resolveEntities: function (sirenObj, options) {
                var self = this
                , resolvedEntities = [];

                _.each(sirenObj.entities, function(entity) {
                    if ((entity.href && options.autoFetch == 'linked') || options.autoFetch == 'all') {
                        resolvedEntities.push(self.fetchEntity(entity, options));
                    } else {
                        resolvedEntities.push(self.addEntity(entity, options));
                    }
                });

                return $.when(resolvedEntities).done(function () {
                    self.trigger('resolve', self);
                });
            }


            /**
             * http://backbonejs.org/#Model-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj, options) {
                this._data = sirenObj; // Stores the entire siren object in raw json
                this._entities = [];

                this.resolveEntities(sirenObj, options);
                this.parseActions(options);

                return sirenObj.properties;
            }


            /**
             * http://backbonejs.org/#Model-toJSON
             *
             * @param {Object} options
             */
            , toJSON: function () {
                var json = _.clone(this.attributes)
                , entities = this.entities();

                _.each(entities, function (entity) {
                    json[entity.rel()] = entity;
                });

                return json;
            }


            /**
             * Filters the entity's properties and returns only sub-entities
             *
             * @return {Array}
             */
            , entities: function (filters) {
                var self = this
                , entities = _.filter(this, function (val, name) {
                    return _.indexOf(self._entities, name) > -1;
                });

                if (filters) {
                    entities = filter(entities, filters);
                }

                return entities;
            }


            /**
             *
             * @param {Object} entity
             */
            , fetchEntity: function (entity) {
                var self = this;

                return $.getJSON(getUrl(entity), function (resolvedEntity) {
                    self.addEntity(resolvedEntity);
                });
            }


            /**
             *
             * @param {Object} entity
             */
            , parseEntity: function (entity) {
                var bbSiren;

                if (_hasClass(entity, 'collection')) {
                    bbSiren = new Backbone.Siren.Collection(entity);
                } else if (_hasClass(entity, 'error')) {
                    // @todo how should we represent errors?
                    warn('@todo - errors');
                } else {
                    bbSiren = new Backbone.Siren.Model(entity);
                    store.add(bbSiren);
                }

                return bbSiren;
            }


            /**
             *
             * @param {Object} entity
             */
            , addEntity: function (entity) {
                var bbSiren = this.parseEntity(entity)
                , rel = bbSiren.rel();

                this.set(rel, bbSiren);
                this._entities.push(rel);

                return bbSiren;
            }


            /**
             * http://backbonejs.org/#Model-constructor
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (sirenObj, options) {
                options = options || {};
                options.parse = true; // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519

                Backbone.Model.call(this, sirenObj, options);
            }

        })


        , Collection: Backbone.Collection.extend({
            url: url
            , classes: classes
            , hasClass: hasClass
            , title: title
            , rel: rel
            , links: links
            , actions: actions
            , getActionByName: getActionByName
            , getAllByAction: getAllByAction
            , parseActions: parseActions
            , request: request


            /**
             * http://backbonejs.org/#Collection-toJSON
             *
             * @param {Object} options
             */
            , toJSON: function (options) {
                return this.map(function(model){
                    return model.toJSON(options);
                });
            }


            /**
             *
             * @param {Function|Object} arg
             * @return {Array}
             */
            , filter: function (arg) {
                if (typeof arg ==  'function') {
                    return _.filter(this, arg);
                } else {
                    return filter(this, arg);
                }
            }


            /**
             * http://backbonejs.org/#Collection-parse
             *
             * @param {Object} sirenObj
             */
            , parse: function (sirenObj, options) {
                this._data = sirenObj; // Store the entire siren object in raw json
                this._meta = sirenObj.properties || {};

                var models = [];
                _.each(sirenObj.entities, function (entity) {
                    var model = new Backbone.Siren.Model(entity);
                    models.push(model);
                    store.add(model);
                });

                this.parseActions(options);

                return models;
            }


            /**
             * Unlike Models, collections don't have attributes.
             * However, there are times we need to store "meta" data about the collection such as
             * the paging "offset".
             *
             * @param {*} prop
             * @param {*} value
             * @return {Object}
             */
            , meta: function (name) {
                return this._meta[name];
            }


            /**
             * http://backbonejs.org/#Collection-constructor
             *
             * @param {Object} attributes
             * @param {Object} options
             */
            , constructor: function (sirenObj, options) {
                options = options || {};
                options.parse = true; // Force "parse" to be called on instantiation: http://stackoverflow.com/questions/11068989/backbone-js-using-parse-without-calling-fetch/14950519#14950519

                Backbone.Collection.call(this, sirenObj, options);
            }
        })
    };
}(_, Backbone));

(function (_, Backbone) {
    'use strict';


    Backbone.Siren.validate = {
        customPatterns: {}

        , standardPatterns: {}

        /**
         *
         * @param {Object} patterns
         */
        , setPatterns: function (patterns) {
            var self = this
            , validInputTypes = 'color date datetime datetime-local email month number range search tel time url week';

            _.each(patterns, function (pattern, name) {
                if (validInputTypes.indexOf(name) == -1) {
                    self.customPatterns[name] = pattern;
                } else {
                    self.standardPatterns[name] = pattern;
                }
            });
        }
    };


    _.extend(Backbone.Siren.Model.prototype, {


        /**
         * Override the default _validate method so we only get changed attributes instead of all attributes
         * More info: https://github.com/documentcloud/backbone/pull/1595
         *
         * @param {Object} attrs
         * @param {Object} options
         * @return {Boolean}
         * @private
         */
        _validate: function (attrs, options) {
            var error;

            if (! (options.validate && this.validate)) {
                return true;
            }

            error = this.validationError = this.validate(attrs, options) || null;
            if (error) {
                this.trigger('invalid', this, error, options || {});
            }

            return !(error && !options.forceUpdate);
        }


        /**
         *
         * @param {Object} field
         */
        , validateEmptyField: function (field) {
            return field.required
                ? {valid: false, valueMissing: true}
                : {};
        }


        /**
         *
         * @param {Backbone.Siren.Model} subEntity
         * @param {Object} field
         */
        , validateSubEntity: function (subEntity, field) {
            var actionName = field.action;
            return subEntity._validate(subEntity.getAllByAction(actionName), {validate: true, actionName: actionName})
                ? {}
                : {customError: true, valid: false};
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateType: function (val, field) {
            var validity = {}
            , type = field.type
            , pattern = Backbone.Siren.validate.customPatterns[type] || Backbone.Siren.validate.standardPatterns[type];

            if (pattern) {
                if (!pattern.test(val)) {
                    validity.valid = false;
                    validity.typeMismatch = true;
                }
            } else if (type && type != 'text' && type != 'entity') {
                Backbone.Siren.warn('Unable to validate type, "' + type + '" as it does not have a matching validation rule.');
            }

            return validity;
        }


        /**
         *
         * @param {String} val
         * @param {Object} field A Siren action field
         */
        , validateConstraints: function (val, field) {
            var validity = {};
            var type = field.type;

            if (field.pattern && ! new RegExp(field.pattern).test(val)) {
                validity.valid = false;
                validity.patternMismatch = true;
            }

            if (type == 'number' || type == 'range') {
                if (field.min && field.min > val) {
                    validity.valid = false;
                    validity.rangeUnderflow = true;
                }

                if (field.max && field.max < val) {
                    validity.valid = false;
                    validity.rangeOverflow = true;
                }

                if (field.step && val%field.step) {
                    validity.valid = false;
                    validity.stepMismatch = true;
                }
            } else if ('text email search password tel url'.indexOf(type) > -1) {
                if (field.maxlength && field.maxlength < val.length) {
                    validity.valid = false;
                    validity.tooLong = true;
                }
            }


            return validity;
        }


        /**
         *
         * @return {Object} An HTML ValidityState object https://developer.mozilla.org/en-US/docs/DOM/ValidityState
         */
        , validateOne: function (val, field /*, options*/) {
            var validity = {
                valueMissing: false
                , typeMismatch: false
                , patternMismatch: false
                , tooLong: false
                , rangeUnderflow: false
                , rangeOverflow: false
                , stepMismatch: false
                , badInput: false
                , customError: false
                , valid: true
            };

            if (!val) {
                validity = _.extend(validity, this.validateEmptyField(field));
            } else {
                _.extend(validity, this.validateType(val, field));

                if (!validity.typeMismatch) {
                    if (val instanceof Backbone.Model) {
                        _.extend(validity, this.validateSubEntity(val, field));
                    } else {
                        _.extend(validity, this.validateConstraints(val, field));
                    }

                }
            }

            return validity;
        }


        /**
         * See http://backbonejs.org/#Model-validate
         * Note that we are changing the signature and passing in an "actionName" instead of attribute values.
         * This is because passing in attribute values is redundant, being that the "action" already knows what attributes
         * to validate.
         *
         * @param {Object} attributes
         * @param {Object} [options]
         * @return {Object|undefined} A keyed mapping of HTML ValidityState objects by name, undefined if there are no errors
         */
        , validate: function (attributes, options) {
            options = options || {};

            var self = this
            , actionName = options.actionName
            , action = this.getActionByName(actionName)
            , errors = {};

            if (action) {
                _.each(action.fields, function (field) {
                    var attributeName = field.name
                    , attribute = attributes[attributeName]
                    , validityState = self.validateOne(attribute, field, options);

                    if (! validityState.valid) {
                        errors[attributeName] = validityState;
                    }
                });
            } else {
                errors['no-actions'] = 'There are no actions matching the name, "' + actionName + '"';
            }

            if (! _.isEmpty(errors)) {
                return errors;
            }
        }

    });

}(_, Backbone));

(function (_, Backbone) {
    'use strict';

    _.extend(Backbone.Siren.Model.prototype, {

    });

}(_, Backbone));

(function (_, Backbone) {
    'use strict';


    /**
     *
     * @param action
     * @param formAttributes
     * @return {Object}
     */
    function parseFormAttributes(action, formAttributes) {
        formAttributes = formAttributes || {};

        return {
            id: formAttributes.id || action.name + '-form'
            , enctype: formAttributes.enctype || action.type
            , method: formAttributes.method || action.method
            , action: formAttributes.action || action.href
            , title: formAttributes.title || action.title
            , novalidate: !formAttributes.validation
        };
    }


    /**
     *
     * @param action
     * @param fieldAttributes
     * @return {Array}
     */
    function parseFieldAttributes(action, fieldAttributes) {
        fieldAttributes = fieldAttributes || {};

        var parsedFieldAttributes = []
        , fields = action.fields;

        _.each(fields, function (field) {
            var fieldName;

            if (field.type != 'entity') {
                fieldName = field.name;
                parsedFieldAttributes.push(_.extend({value: action.parent.get(fieldName)}, field, fieldAttributes[fieldName]));
            } else if (field.type == 'entity') {
                // @todo, how to handle the view for sub-entities...?
                console.log('@todo - how to handle sub-entity views?');
            }
        });

        return parsedFieldAttributes;
    }


    Backbone.Siren.FormView = Backbone.View.extend({

        tagName: 'form'

        , events: {
            'submit': 'handleFormSubmit'
            , 'change input, select': 'handleFormElementChange'
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormSubmit: function (event) {
            event.preventDefault();
            this.model.getActionByName(this.action.name).execute();
        }


        /**
         *
         * @param {jQuery.Event} event
         */
        , handleFormElementChange: function (event) {
            var $target = $(event.target);
            var data = {};
            data[$target.attr('name')] = $target.val();

            this.model.set(data, {validate: !!this.options.validateOnChange, actionName: this.action.name, forceUpdate: true});
        }


        /**
         * Override to create a custom template
         *
         * @param {Object} data
         */
        , template: function (data) {
            /*jshint multistr:true */

            var tpl = '<% _.each(fieldAttributes, function (field, fieldName) { %> \
                <div> \
                    <label for="<%= field.id %>"><%= field.label %></label> \
                    <input type="<%= field.type %>" name="<%= field.name %>" id="<%= field.id %>" value="<%= field.value %>" /> \
                </div> \
            <% }); %> <input type="submit" class="submitButton" />';

            return  _.template(tpl)(data);
        }


        /**
         *
         * @param {Object} data
         */
        , parseAction: function (data) {
            var action;

            if (! (data && data.action)) {
                throw 'Missing required property: "action"';
            }

            action = data.action;
            if (! (action.parent instanceof Backbone.Siren.Model)) {
                throw 'Action object either missing required "parent" or "parent" is not a Backbone.Siren Model';
            }

            return {
                attributes: parseFormAttributes(action, data.formAttributes)
                , fieldAttributes: parseFieldAttributes(action, data.fieldAttributes)
                , model: action.parent
                , action: action
            };
        }


        /**
         * Override if you wanna get fancy.
         *
         * @param {Object} data
         */
        , render: function (data) {
            return this.$el.html(this.template(data));
        }


        /**
         *
         * @param {Object} data
         */
        , _render: function (data) {
            return this.render(data);
        }


        /**
         *
         * @param {Object} data
         */
        , constructor: function (data) {
            data = _.extend({}, data, {validateOnChange: true});
            var parsedData = this.parseAction(data);

            // Set our parsed data as top level properties to our view + pass them directly to our template
            Backbone.View.call(this, _.extend({}, data, parsedData));
            this.action = parsedData.action;
            this._render(parsedData);
        }

    });

}(_, Backbone));