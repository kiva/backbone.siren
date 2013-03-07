[![Build Status](https://travis-ci.org/kiva/backbone.siren.png)](https://travis-ci.org/kiva/backbone.siren)
# Backbone.Siren WIP

A client side adapter that converts resource representations from [Siren JSON](https://github.com/kevinswiber/siren) to [Backbone Models](http://backbonejs.org/#Model) and [Collections](http://backbonejs.org/#Collection).

## This project is still in the design phase.  Things will break.

## Development

1. Clone this repo

2. Run `npm install`

3. Develop

### Unit tests

@todo

### Code quality

Changes should follow existing patterns and pass jshint.

## Use

To use Backbone.Siren:

```
bbSirenInstance = new Backbone.Siren.Model(sirenObject);
```

Now in addition to your standard set of Backbone.Model methods, you have few extra methods that help you interact with your Siren representation.

### Working with Models

```
bbSirenInstance = new Backbone.Siren.Model(sirenObject);

bbSirenInstance.classes();
bbSirenInstance.hasClass();
bbSirenInstance.title();
bbSirenInstance.rel();
bbSirenInstance.actions();
bbSirenInstance.getActionByName();
bbSirenInstance.getAllByAction();
bbSirenInstance.request();
bbSirenInstance.links();
bbSirenInstance.entities();
```

### Working with collections

Backbone.Siren determines if your entity is a collection by checking for a "collections" class.

If the "collection" class is found, Backbone.Siren will create a Backbone.Collection instance instead of a Backbone.Model instance and nest all entities as models under the collection.
From there on out you can use any Backbone.Collection.

To work with a collection:
```
bbSirenInstance = new Backbone.Siren.Collection(sirenObject);

bbSirenInstance.classes();
bbSirenInstance.hasClass();
bbSirenInstance.title();
bbSirenInstance.rel();
bbSirenInstance.actions();
bbSirenInstance.getActionByName();
bbSirenInstance.getAllByAction();
bbSirenInstance.request();
bbSirenInstance.links();
```

### Siren Actions

Siren actions are set directly as properties to your Model or Collection.

```
bbSirenInstance = new Backbone.Siren.Collection(sirenObject);
bbSirenInstance.actionName();
```

### Options

```
{
    autoFetch: ''   // Will automatically fetch sub-entities if enabled. Can be set to 'linked' or 'all'.
}
```

