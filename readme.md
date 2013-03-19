[![Build Status](https://travis-ci.org/kiva/backbone.siren.png)](https://travis-ci.org/kiva/backbone.siren)
# Backbone.Siren WIP

A client side adapter that converts resource representations from [Siren JSON](https://github.com/kevinswiber/siren) to [Backbone Models](http://backbonejs.org/#Model) and [Collections](http://backbonejs.org/#Collection).

## This project is still in the design phase.  Things will break.

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

## Development

1. Clone this repo

2. Run `npm install`

3. Develop

### Specs and Testing

Specs are written using [rspec](http://rspec.info/) style "expectations" with [BusterJs](http://docs.busterjs.org/en/latest/) as the testing framework, toolkit & libray.

Here's a breakdown of the test files:

`test/spec/*` are all the spec files.
`test/buster.js` is the BusterJs configuration file
`coverage.lcov` is a breakdown of unit test coverage. It's automatically generated when unit tests are run.

[Travis CI](travis-ci.org/kiva/backbone.siren) will run these tests on each push to github.

####Useful Commands

Run jshint + buster tests:
```
> grunt test
```

Run jshint only:
```
> grunt jshint
```

Run buster tests only:
```
> grunt buster
```

#### Generating [lcov]() coverage reports

You can generate your own, updated, visual lcov reports.

[buster-coverage](https://github.com/ebi/buster-coverage) will automatically generate a static coverage report in either xml or lcov format.
By default, this project is set to generate lcov reports.  There are different ways of generating a visual report from this a lcov file, here is how I've done it:

Install [genhtml](http://linux.die.net/man/1/genhtml)
```
> brew install genhtml
```

Parse the coverage report and Generate an html file.  Save it to `test/coverage`:
```
> genhtml test/coverage/coverage.lcov -o test/coverage
```

### Code quality

Changes should follow existing patterns and pass jshint.

