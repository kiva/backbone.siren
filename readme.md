# Backbone-Siren

A client side adapter that converts resource representations from [Siren JSON](https://github.com/kevinswiber/siren) to [Backbone Models](http://backbonejs.org/#Model).

In Siren, there are a few different objects that can be represented:
* Entity Model
* Entity Collection
* Actions Collection
* Links Collection

Backbone-Siren subclasses the Backbone.Model and Backbone.Collection objects as Backbone.Siren.Model and Backbone.Siren.Collection.

# Creating a Backbone.Siren Model

## Simple

```
var sirenModel = new Backbone.Siren.Model.extend({
    url: ['api.kiva.org/lender', 'api.kiva.org/lenderprofile']
});
```

Behind the scenes, Backbone-Siren builds a default Backbone Model that represents your Siren resources.
Backbone-Siren adds all `definition` type properties to a `definitions` object that's at the top level of the Model object.

## More complicated

```
var sirenModel = new Backbone.Siren.Model.extend({
    url: ['api.kiva.org/lender', 'api.kiva.org/lenderprofile']


        , definitions: {
            iLoanBecause: {
                from: 0 // 0 is the index value of the url from the urls array, clearly this needs work to be more intuitive

                // a js validation object, empty unless validation is specified on the siren object
                // ValidityState Object ->  https://developer.mozilla.org/en-US/docs/DOM/ValidityState
                , validation: {} // can not be overriden

                , mutable: '' // Boolean, true iff there are actions defined on the siren object, can not be overriden
                , transient: false // by default all properties that come from the api are NOT transient.  Transient are fields that are added by the app and should not be savedd to the server.  Can not be overriden

                /**
                 *
                 * lender and profile are both the siren-json representation that was returned by the server
                 */
                , value: function (lender, profile) {
                    return 'someStuff';
                }
            }
        }
});
```

# The API

Create a new instance of Backbone.Siren.Model
```
sirenModel = new Backbone.Siren.Model();
```

## Standard Backbone.Model methods

Get properties (See http://backbonejs.org/#Model-get)
```
sirenModel.get(propName)
```

Set values to properties (See http://backbonejs.org/#Model-set)
```
sirenModel.set(propName, value)
```

Save the model to the server (See http://backbonejs.org/#Model-save)
```
sirenModel.save() // wrapper for Backbone.save() and takes care of updating multiple end points
```

Validation (See http://backbonejs.org/#Model-validate)
```
sirenModel.validate();          // validates all current writable properties (gets called behind the scenes on set) - returns undefined or an object
sirenModel.validate('propName');// validates the one property - returns undefined or a string
```

## Custom Backbone.Siren.Model methods

Get urls used to retrieve the properties
```
sirenModel.url() // Should it be .urls()?
```

Get the siren "class" for the given model(s)
```
sirenModel.class()
```

Get nested entities
```
siren.entity(someKindOfFilter)     // Returns a Backbone.Siren.Model representation of the first entity that matches
siren.entities(someKindOfFilter)   // Returns a collection of all subentities that match the filter
```

Fetch more data from a sub-entity
```
var myNestedEntity = siren.entity().fetch()
```

Get a collection of all available actions
```
sirenModel.actions();           // returns a backbone.sirenAction collection
``

Auto-generate a form form
```
sirenModel.generateForm();  // this would be a seperate plugin that autogenerates a generic form, you have to pass it the display names for the fields.
```

## Entity Filtering:

You pass it a string and it will search in the following order for something that matches:
- always has to be a string, or number
- rel
- class
- links.rel === 'self' (it will check if the href matches the same path as the 'self' link)
- properties

