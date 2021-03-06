# Set up

Barista is all static files. However, for development ease and
performance reasons, some preprocessing is done on the static
files. HTML files are generated with [HAML](http://haml-lang.com/),
CSS files are generated with
[Compass](http://compass-style.org)/[SASS](http://sass-lang.com/),
and JS files are (optionally) generated from
[CoffeeScript](http://coffeescript.org/) and then merged into one.

## Development web server

To speed up development without having to worry about preprocessing
the files each time you make a change, Barista includes a simple web
server that you can use during development that takes care of the
preprocessing for you.

### Prerequisites

The development server runs on [Node.js](http://nodejs.org/), so
you're gonna need to install that first.

[HAML](http://haml-lang.com/), [SASS](http://sass-lang.com/), and
[Compass](http://compass-style.org) are Ruby modules. You can
install them all like this:

    gem install compass

If you want to write your scripts in
[CoffeeScript](http://coffeescript.org/), install
[Npm](http://npmjs.org/), then:

    npm install coffee-script

Finally, if you want good support for [Markdown](http://daringfireball.net/projects/markdown/) in your HAML files, you should also install [Maruku](http://maruku.rubyforge.org/):

    gem install maruku

### Start development

Run:

    node develop.js

Then visit [http://localhost:5678/](http://localhost:5678/). If you
did everything right you should see a simple Barista web site.

## Deployment

_Watch this space for help on how to compile and compress all the
static files for deployment and (optionally) upload them to
CloudFront._

## All set up?

Proceed to the [tutorial](barista/blob/master/TUTORIAL.md).