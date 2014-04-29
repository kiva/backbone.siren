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

### Generating [lcov](http://ltp.sourceforge.net/coverage/lcov.php) coverage reports

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

## Code quality

Changes should follow existing patterns and pass jshint.

## Pull requests

Pull requests should be made to the `pre-release` branch and should _not_ include changes to the `/dist` folder.