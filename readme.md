There are a few different things we can represent with Siren:
- Entity Model
- Entity Collection
- Actions Collection
- Links Collection

I'm thinking maybe I should only represent models, everything else would be a property of the siren model.

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

// Not so sure we would need this.  Thinking that every siren representation should be a model (which can have 1+ nested collections)
var mySirenCollection = Backbone.Siren.Collection.extend({]);

// Note that url is an array
var mySirenModel = Backbone.Siren.Model.extend({
    url: []
})

var sirenCollection = new mySirenCollection();
var siren = new mySirenModel({});


siren.get() // get properties
have to rename this as it collides with Backbone.save()    -> siren.set() // builds a serialized form in memory so that it can then be saved to the server on siren.save();  - it ignores readonly properties
siren.save() // wrapper for Backbone.save() and takes care of updating multiple end points
siren.url() // get the "self" current url
siren.class() // get the current class
siren.validate()   // validates all current writable properties (gets called behind the scenes on set) - returns undefined or an object
siren.validate('propertyName') // validates the one property - returns undefined or a string

siren.entity(someKindOfFilter)     // gets the first entity that matches (a backbone.siren model)

siren.entities(someKindOfFilter)   // gets subentities (as a backbone.siren collection)
siren.entities(someKindOfFilter).____ all of these are backbone methods

var myNestedEntity = siren.entity().fetch()         // does ajax request for more data
siren.actions();           // returns a backbone.sirenAction collection
siren.generateForm();  // this would be a seperate plugin that autogenerates a generic form, you have to pass it the display names for the fields.


Entity Filtering:

you pass it a string and it will search in the following order for something that matches:
- always has to be a string, or number
- rel
- class
- links.rel === 'self' (it will check if the href matches the same path as the 'self' link)
- properties

