[![Build Status](https://travis-ci.org/kiva/backbone.siren.png)](https://travis-ci.org/kiva/backbone.siren)
[![Coverage Status](https://coveralls.io/repos/kiva/backbone.siren/badge.png?branch=master)](https://coveralls.io/r/kiva/backbone.siren?branch=master)
[![Code Climate](https://codeclimate.com/repos/52c50554e30ba002b60004c4/badges/744f7fa0bb6baaaffc2e/gpa.png)](https://codeclimate.com/repos/52c50554e30ba002b60004c4/feed)
# Backbone.Siren

A client side adapter that converts resource representations from [Siren JSON](https://github.com/kevinswiber/siren) to [Backbone Models](http://backbonejs.org/#Model) and [Collections](http://backbonejs.org/#Collection).

## Basic Use

To use Backbone.Siren:

```
bbSirenModel = new Backbone.Siren.Model(sirenObject);
// or
bbSirenCollection = new Backbone.Siren.Collection(sirenObject);
```

Or, you can just point Backbone.Siren to a url that returns a Siren resource and let it do the rest:

```
Backbone.Siren.resolve('http://my.api.io/user/123');
```

If you're building an app that uses a Siren API on the backend:

```
var sirenApi = new Backbone.Siren('http://my.api.io');

// Request particular endpoints.  In this case `http://my.api.io/user/123` and `http://my.api.io/basket/111`
sirenApi.resolve('user/123').done(function (userModel) {});
sirenApi.resolve('basket/111').done(function (basketModel) {});

// Or
userModel = sirenApi.resolve(['user/123', 'basket/111']).done(function (userModel, basketModel) {});

```

## Example

```
var sirenApi = new Backbone.Siren('http://my.api.io');

var UserView = Backbone.View.extend({

	template: _.template(...)

	, render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	}

	, initialize: function () {
		var self = this;

		sirenApi.resolve('user/123').done(function (userModel) {
			self.model  = userModel;
			self.render();
		});
	}
});

var userView = new UserView();
```

### Options

```
{
    autoFetch: 'linked'   // Will automatically fetch sub-entities if enabled. Can be set to 'linked' or 'all'.
    , forceUpdate: false  // Pass forceUpdate as an option into your .set() method and it will update the model, even if it fails validation
}
```

## Backbone.Siren.FormView

Siren allows you to declare what "actions" your can be taken on a model.  Backbone.Siren provides a simple way to render a form for one of these actions.

Backbone.Siren.FormView will generate a default form if passed a bbSiren Model (does not work with bbSiren Collections).



The methods `.template()` and `.render()` can be overwritten to customize the look of your form.
You can also overwrite the `.handleFormSubmit()` and `.formElementChange()` methods which will, by default, submit the form and set model attributes respectively.

### FormView Example

Generates a form that will execute the `updateUser` action when the `.submitButton` is clicked.

```
var UpdateUserFormView = Backbone.Siren.FormView.extend({

	event: {
        'click .submitButton': this.action.execute()
	}

	, initialize: function () {
        var self = this
        , updateUserAction = accountModel.getActionByName('updateUser');

	    qi.sirenApi.resolve('user/123').done(function (userModel) {
			self.initializeForm({action: updateUserAction});
			self.render();
        });
	}
});

var updateUserFormView = new UpdateUserFormView();

```

### FormView Options

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

## Changelog

### 0.3.0 (1/2/2014)

* .resolve() now accepts an array of urls (#21)
* You can now have multiple store instances
* `new Backbone.Siren()` will now create a new API client instance with its own store (#22)
* Collections and partial entities are now cached in the store (#19 and #35)
* Request promises are now removed from the store once a request is fulfilled. (#35)
* Improved test coverage
* Other [bug fixes](https://github.com/kiva/backbone.siren/issues?milestone=1&page=1&state=closed)

 [![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/kiva/backbone.siren/trend.png)](https://bitdeli.com/free "Bitdeli Badge")