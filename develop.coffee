#!/usr/bin/env coffee

# Static sites nowadays are not built with HTML, CSS, and Javascript,
# like grandma used to do it. These days, we have
# [HAML](http://haml-lang.org/), [Compass](http://compass-style.org/),
# and [CoffeeScript](http://coffeescript.org/). They are obviously
# much more awesome, because they all use significant
# whitespace. Except they have another thing in common: they need to
# be pre-processed into something grandma's browser can understand.

# Let me tell you, that's a PITA. Because running a command to compile
# on each change is not an option. If grandma used to be able to make
# a change and refresh, I want to be able to do it too.

# The usual solution is to run a script that watches files for
# changes, and compiles them on the fly. Except I'm way faster than
# the script. By the time the script is done compiling, I've already
# refreshed the browser 27 times and I'm wondering why my change had
# no effect.

# We need a better solution. And the solution is right here. That's
# right, it's a development web server. Like the one Django has. But
# for static files.

### Configuration ###

# This is where your static files live.
STATIC = 'static'

# This is the port the development server will listen on.
PORT = 5678

### Set up ###

fs = require 'fs'
path = require 'path'

### HTTP handlers ###

# This is where it all starts, when an HTTP request comes in. The
# request is dispatched to one of the handlers below based on the type
# of file that is being requested.

server = (req, res) ->
    log "#{req.method} #{req.url}"
    for [rule, handler] in handlers
        matches = req.url.match rule
        if matches
            return handler matches[1], res
    log 'Not found!'
    notFound(res)

# If the request is for a **CSS** file, first check to see if a
# corresponding SASS file exists.  If it does, compile it and return
# it, otherwise simply return the CSS file.

handleCss = (file, res) ->
    pickFirst "#{STATIC}/#{file}.sass", "#{STATIC}/#{file}.css", (error, file) ->
        if error then return notFound(res)
        if path.extname(file) == '.sass'
            compileSass file, err(log) write(res, 'text/css')
        else
            writeFile res, file, 'text/css'

# Similarly, if a request is for an **HTML** file, look for a
# corresponding HAML file first, otherwise just look for the HTML
# file. If neither is found, try treating the path as a directory, and
# look for an index file within it.

handleHtml = (file, res) ->
    file = stripExt file, '.html'
    pickFirst "#{STATIC}/#{file}.haml", "#{STATIC}/#{file}.html", "#{STATIC}/#{file}/index.haml", "#{STATIC}/#{file}/index.html", (error, file) ->
        if error then return notFound(res)
        if path.extname(file) == '.haml'
            compileHaml file, err(log) write(res, 'text/html')
        else
            writeFile res, file, 'text/html'

# If the request is for a **Javascript** file, simply call `loadJs`, which
# will take care of looking for CoffeeScript or Javascript files, and
# process the require directives recursively.

handleJs = (file, res) ->
    loadJs "#{STATIC}/#{file}", err(log) write(res, 'application/x-javascript')

# Anything else is probably just a static file. Simply spit out its
# contents as they are.

handleStatic = (file, res) ->
    fs.readFile "#{STATIC}/#{file}", err(log) write(res)

# These are the regular expressions used to decide which handler to
# dispatch to. Note that extensions for html files are optional.

handlers = [
    [/^\/((.+\/)*.+)\.css/, handleCss]
    [/^\/((.+\/)*.+)\.js/, handleJs]
    [/^\/((.+\/)*[^.]*)(\.html)?/, handleHtml]
    [/^\/((.+\/)*[^.]*\.[^.]*)/, handleStatic]
]

### Javascript/CoffeeScript ###

# These functions allow for compiling CoffeeScript files on the fly
# and also merging them into one by following the chain of includes.
#
# The syntax for includes is:
#
#     ### require "subdir/file" ###
#
# for CoffeScript, and
#
#     /* require "subdir/file" */
#
# for Javascript.

# Conveniently, the first one compiles into the second one, so we can
# simply convert CoffeeScripts into JS first, then look for the JS
# require comments.

REQUIRE_RULE = /\/\*\s+require\s+["'](.+)['"]\s+\*\//g

# We start by looking for the first file that exists that corresponds
# to the given module name. Look for a `.coffee` file first, then for
# a `.js`. Unless CoffeeScript is not installed, in which case only
# look for `.js` files.

loadJs = (file, callback) ->
    choices = if coffee then ["#{file}.coffee", "#{file}.js"] else ["#{file}.js"]
    pickFirst choices..., err(callback) (file) ->
        if path.extname(file) == '.coffee'
            compileCoffee file, callback
        else
            fs.readFile file, 'utf-8', err(callback) (content) ->
                processRequires file, content, callback

# If the files are CoffeeScript files, compile them by calling back to
# the `coffee` module. Otherwise, go straight to the processing of
# require directives.
#
# By the way, here we do something smart with any exceptions. Instead
# of printing out in the log file, we return valid JS that puts a
# nicely formatted error message right in the page that requested this
# JS file.

coffee = try require 'coffee-script' catch e then no

compileCoffee = (file, callback) ->
    fs.readFile file, 'utf-8', err(callback) (content) ->
        try
            processRequires file, coffee.compile(content), callback
        catch error
            stack = error.stack.replace(/\n/g, '\\n\\\n').replace(/"/g, '\\"')
            callback ok, "document.body.innerHTML = \"<h3 style='color: #c30'>Error in #{file}</h1><pre>#{stack}</pre>\""

# This does the actual replacing of include directives with the
# content of the files. It uses `asyncReplace` to call recursively
# back to the asynchronous function `loadJs` for every include
# directive found.

processRequires = (file, content, callback) ->
    f = (match, cb) ->
        other = path.join(path.dirname(file), match[1])
        loadJs other, cb
    asyncReplace content, REQUIRE_RULE, f, callback


### CSS/SASS/Compass ###

# Compiling Compass/SASS files into CSS files is easy. Unfortunately
# the only way to do it is to spawn a new process to call the Ruby
# `compass` command. We then have to read from the CSS file it outputs
# to disk.

compileSass = (file, callback) ->
    dir = path.dirname file
    target = "#{dir}/#{path.basename(file, '.sass')}.css"
    exec "compass compile --sass-dir #{dir} --css-dir #{dir} --images-dir #{STATIC} -s compressed --relative-assets #{file}", '', '.', err(callback) (output) ->
        log output
        fs.readFile target, 'utf-8', callback


### HTML/HAML ###

# Processing HAML is very similar, except there is a Node.js version
# of HAML. Try to use that if it's installed, otherwise call out to
# the Ruby `haml` command. Personally I prefer the Ruby version anyway
# since it's more complete, more up to date, and it supports Markdown,
# and even advanced Markdown with Maruku.

haml = try require 'hamljs' catch e then no

compileHaml = (file, callback) ->
    dir = path.dirname file
    target = "#{dir}/#{path.basename(file, '.haml')}.html"
    fs.readFile file, 'utf-8', err(callback) (content) ->
        if haml
            haml.render content, callback
        else
            exec 'haml -f html5', content, dir, callback


### Helpers ###

# Alias `null` to `ok` so you can write `callback ok, result`.
ok = null

# A function with a short name for logging and debugging.
log = (args...) ->
    for arg in args
        if arg instanceof Error
            console.log arg.stack
        else if arg != undefined
            console.log arg

# Wraps a `callback` function with another one that takes care of
# error handling by forwarding the error straight up the callback
# chain.
err = (callback) ->
    (f) ->
        (err, result) ->
            if err
                callback err
            else
                f result

# Find the first file in the list of arguments that exists.
pickFirst = (first, rest..., callback) ->
    path.exists first, (exists) ->
        if exists
            callback ok, first
        else
            return callback "not_found" if not rest.length
            pickFirst rest..., callback

# Write a file back to the HTTP response.
writeFile = (res, file, type) ->
    fs.readFile file, 'utf-8', err(log) write(res, type)

# Write a string back to the HTTP response.
write = (res, type) ->
    (content) ->
        res.writeHead 200, { 'Content-Type': "#{type}; charset=utf-8" }
        res.write content
        res.end()

# Return a 404 to the HTTP response.
notFound = (res) ->
    res.writeHead 404, {}
    res.write 'Not found.'
    res.end()

# An asynchronous version of `forEach`. Calls `callback` with no
# arguments once it's done running `f` for every item in `list`.

asyncEach = (list, f, callback) ->
    i = list.length
    cb = err(callback) () ->
        i--
        if i == 0
            callback ok
    f(el, cb) for el in list

# Converts a `RegExp.match`-style iterator into a regular list.

toList = (f) ->
    el while el = f()

# Remove the extension from the file name, while keeping the directory
# structure. Optionally specify which extension to remove (`ext`).

stripExt = (file, ext) ->
    ext or = path.extname(file)
    path.join path.dirname(file), path.basename(file, ext)


# Replace all the occurences of `rule` in `string` with the result of
# calling `f`. This is similar to the built-in Javascript function
# `String.replace`, except `f` is asynchronous.
#
# `callback` is called with the resulting string on success.

asyncReplace = (string, rule, f, callback) ->
    matches = toList () -> rule.exec string
    return callback ok, string if not matches.length

    replacements = {}

    each = (match, cb) ->
        f match, err(callback) (content) ->
            replacements[match[0]] = content
            cb ok

    asyncEach matches, each, err(callback) () ->
        callback ok, string.replace rule, (str) ->
            replacements[str]

# This function is similar to the Node.js `child_process.exec`, except
# it also allows the caller to specify a string, `input` to be passed
# to stdin, and also the working directory in which the subprocess
# will be started. Logs stderr and returns a `callback` with the
# contents of stdout.

child_process = require 'child_process'

exec = (command, input, cwd, callback) ->
    if not callback
        [callback, cwd] = [cwd, undefined]
    if not callback
        [callback, input] = [input, undefined]

    [arg, args...] = command.split ' '

    proc = child_process.spawn arg, args, { cwd: cwd }
    if input
        proc.stdin.write input
        proc.stdin.end()

    stdout = []
    stderr = []
    proc.stdout.on 'data', (data) ->
        stdout.push data
    proc.stderr.on 'data', (data) ->
        stderr.push data
    proc.on 'exit', (code) ->
        log stderr.join '' if stderr.length
        callback ok, stdout.join ''

### Start ###

http = require 'http'
http.createServer(server).listen(PORT)
log "Barista development server listening on http://localhost:#{PORT}/"