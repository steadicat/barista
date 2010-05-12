# Set up

Barista is all static files. However, for development ease and
performance reasons, some pre-processing is done on the static
files. HTML files are generated with [HAML](http://haml-lang.com/),
CSS files are generated with
[Compass](http://compass-style.org)/[SASS](http://sass-lang.com/), and
JS files are merged into one using
[Sprockets](http://getsprockets.org/).

## Generating the static files

Thanks to [Tim Anglade](http://github.com/timanglade), there's a nice
script that watches all the source files for changes and compiles them
automatically.

### Prerequisites

    gem install compass maruku sprockets fssm yui-compressor

### Start development

Run:

    ./start

This will watch all .haml, .sass, and .js files for changes and
regenerate the master.css, the master.js and all the .html files.

## Web server config

While you can, in theory, run a Barista site in your browser as
static files, I encourage you to view it through a web server, as
that allows you to use absolute paths, and creates fewer surprises
when you deploy.

The web server should be configured to add a proper Content-Type
header so it won't mangle special characters. For Nginx:

    charset utf-8;

All the static files should be gzipped:

    gzip on;
    gzip_types text/html text/css application/x-javascript;

The JS is already minified by the watch script. SASS automatically minifies the CSS.

#### All set up?

Proceed to the [tutorial](barista/blob/master/TUTORIAL.md).