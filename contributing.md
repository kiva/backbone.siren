# Contributing

## Dependencies

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

## Get started

1. Clone this repo

2. Run `npm install`

3. Contribute

## Specs and Testing

Specs are written using [rspec](http://rspec.info/) style "expectations" with [BusterJs](http://docs.busterjs.org/en/latest/) as the testing framework, toolkit & library.

Here's a breakdown of the test files:

`test/buster.js` is the BusterJs configuration file

`test/spec/*` are all the spec files.

`test/coverage/` is automatically generated when unit tests are run and contains all test coverage information.  `test/coverage/lcov-report/index.html` provides an html summary of the results. 

[Travis CI](travis-ci.org/kiva/backbone.siren) will run all tests on each push to github.

### Useful Commands

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

### Coverage reports

The coverage report will be sent to [coveralls.io](https://coveralls.io/r/kiva/backbone.siren) when the tests are run on Travis. Test coverage should go up, not down.

## Code quality

Changes should follow existing patterns and pass jshint.