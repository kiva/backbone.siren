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

Specs are written using [rspec](http://rspec.info/) style "expectations" with [BusterJs](http://docs.busterjs.org/en/latest/) as the testing framework, toolkit & libray.

Here's a breakdown of the test files:

`test/buster.js` is the BusterJs configuration file

`test/spec/*` are all the spec files.

`test/coverage/coverage.lcov` is a breakdown of unit test coverage. It's automatically generated when unit tests are run.

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

Travis will generate coverage reports and output them to [coveralls.io](https://coveralls.io/r/kiva/backbone.siren).  Test coverage should go up, not down.

### Generating [lcov](http://ltp.sourceforge.net/coverage/lcov.php) coverage reports locally

You can generate your own, updated, visual lcov reports.  [buster-coverage](https://github.com/ebi/buster-coverage) will automatically generate an lcov test coverage report.

To generate a visual report in html:

Install [genhtml](http://linux.die.net/man/1/genhtml)
```
> brew install genhtml
```

Parse the coverage report and Generate an html file.  Save it to `test/coverage`:
```
> genhtml test/coverage/coverage.lcov -o test/coverage
```

## Code quality

Changes should follow existing patterns and pass jshint.

## Pull requests

Pull requests should be made to the `pre-release` branch and should _not_ include any changes to the `/dist` folder.