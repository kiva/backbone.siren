[![Build Status](https://travis-ci.org/kiva/backbone.siren.png)](https://travis-ci.org/kiva/backbone.siren)
# Backbone.Siren WIP

A client side adapter that converts resource representations from [Siren JSON](https://github.com/kevinswiber/siren) to [Backbone Models](http://backbonejs.org/#Model) and [Collections](http://backbonejs.org/#Collection).

## This project is still in the design phase.  Things will break.

## Use

To use Backbone.Siren:

```
bbSirenModel = new Backbone.Siren.Model(sirenObject);
// or
bbSirenCollection = new Backbone.Siren.Collection(sirenObject);
```

In addition to your standard set of Backbone.Model and Backbone.Collection methods, you have few extra methods that help you interact with your Siren representations.

### Working with Models

```
bbSirenModel = new Backbone.Siren.Model(sirenObject);

bbSirenModel.classes();
bbSirenModel.hasClass();
bbSirenModel.title();
bbSirenModel.rel();
bbSirenModel.actions();
bbSirenModel.getActionByName();
bbSirenModel.getAllByAction();
bbSirenModel.request();
bbSirenModel.links();
bbSirenModel.entities();
```
Backbone.Siren will parse all nested and linked entities, if the entity is a Collection (has a class of "collection") Backbone.Siren will know to parse it as a Backbone.Siren.Collection.

### Working with collections

```
bbSirenCollection = new Backbone.Siren.Collection(sirenObject);

bbSirenCollection.classes();
bbSirenCollection.hasClass();
bbSirenCollection.title();
bbSirenCollection.rel();
bbSirenCollection.actions();
bbSirenCollection.getActionByName();
bbSirenCollection.getAllByAction();
bbSirenCollection.request();
bbSirenCollection.links();
```

### Siren Actions

Siren actions are set directly as properties to your Model or Collection.

```
var editUserAction = bbSirenModel.getActionByName('edit-user');

// Get a specific field
var firstNameField = editUserAction.getFieldByName('firstName');

// Execute the action
var jqXhrResult = editUserAction.execute();

```

Actions have:

```
.parent     // the parent model to the action
```


### Options

```
{
    autoFetch: 'linked'   // Will automatically fetch sub-entities if enabled. Can be set to 'linked' or 'all'.
    , forceUpdate: false  // Pass forceUpdate as an option into your .set() method and it will update the model, even if it fails validation
}
```

### Backbone.Siren.Validate

Backbone.Siren.Validate will automatically validate your Model's attributes.
It does this by parsing your Siren object and expecting fields to follow the [siren-validation spec](https://github.com/kevinswiber/siren/pull/12).

By Default, Siren.Validate will always validate on `save`, but only validate on `set` if `{validate: true}` is set in the options parameter.

All standard actions/events will happen when validating a Backbone.Siren model. [http://backbonejs.org/#Model-validate]
This means that .validate() won't return anything on success but will return a mapping of field name to [ValidityState](https://developer.mozilla.org/en-US/docs/DOM/ValidityState) objects on failure.

### Backbone.Siren.FormView

Backbone.Siren.FormView will generate a default form if passed a bbSiren Model (does not work with bbSiren Collections).

The methods `.template()` and `.render()` can be overwritten to customize the look of your form.
You can also overwrite the `.handleFormSubmit()` and `.formElementChange()` methods which will, by default, submit the form and set model attributes respectively.

#### Options

```
{
    action: bbSirenAction       // Required, a bbSiren Action.
    , validateOnChange: true    // Optional, Whether or not to validate ui changes.  Default is true
    , formAttributes: {}        // Optional, A mapping of html attribute properties to their values
    , fieldAttributes: {}       // Optional, A mapping of field names to html attribute properties
}
```

## Development

### Dependencies

[nodejs](http://nodejs.org/) required by all the development tools.

[npm](https://npmjs.org/) for managing server side, development, dependencies

[Bower](https://github.com/twitter/bower) for managing client side dependencies
```
npm install -g bower
```

[Grunt](http://gruntjs.com/) for managing various "tasks"
```
npm install -g grunt-cli
```

[Buster](http://docs.busterjs.org) for running unit tests
```
npm install -g buster
```

### Get started

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

#### Useful Commands

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

#### Generating [lcov](http://ltp.sourceforge.net/coverage/lcov.php) coverage reports

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

