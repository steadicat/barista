#!/usr/bin/env coffee

STATIC = 'static'
PORT = 5678

fs = require 'fs'
path = require 'path'
child_process = require 'child_process'
http = require 'http'
try
    coffee = require 'coffee-script'
catch e
    coffee = undefined

log = (args...) ->
    for arg in args
        if arg instanceof Error
            console.log arg.stack
        else if arg != undefined
            console.log arg

err = (callback) ->
    (f) ->
        (err, result) ->
            if err
                callback err
            else
                f result

ret = (callback) ->
    (err, result) ->
        if err
            callback err
        else
            callback no, result

pickFirst = (first, rest..., callback) ->
    path.exists first, (exists) ->
        if exists
            callback no, first
        else
            return callback "not_found" if not rest.length
            pickFirst rest..., callback

writeFile = (res, file, type) ->
    fs.readFile file, 'utf-8', err(log) write(res, type)

write = (res, type) ->
    (content) ->
        res.writeHead 200, { 'Content-Type': type, 'Content-Length': content.length }
        res.write content
        res.end()

notFound = (res) ->
    res.writeHead 404, {}
    res.write 'Not found.'
    res.end()

### Javascript/CoffeeScript ###

REQUIRE_RULE = /\/\*\s+require\s+[\'\"](.+)[\'\"]\s+\*\//g
processRequires = (file, content) ->
    content.replace REQUIRE_RULE, (str, relfile) ->
        other = path.join(path.dirname(file), relfile)
        processRequires other, fs.readFileSync "#{other}.js", 'utf-8'

compileCoffee = (file, callback) ->
    fs.readFile file, 'utf-8', err(callback) (content) ->
        try
            callback no, processRequires(file, coffee.compile(content))
        catch error
            stack = error.stack.replace(/\n/g, '\\n\\\n').replace(/"/g, '\\"')
            callback no, "document.body.innerHTML = \"<h3 style='color: #c30'>Error in #{file}</h1><pre>#{stack}</pre>\""

loadJs = (file, callback) ->
    if coffee
        tries = ["#{file}.coffee", "#{file}.js"]
    else
        tries = ["#{file}.js"]
    pickFirst tries..., err(callback) (file) ->
        if path.extname(file) == '.coffee'
            compileCoffee file, ret(callback)
        else
            fs.readFile file, 'utf-8', err(callback) (content) ->
                callback no, processRequires(file, content)

### HTML/HAML ###

exec = (command, input, callback) ->
    if not callback
        callback = input
        input = undefined
    [arg, args...] = command.split ' '

    proc = child_process.spawn arg, args
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
        log stderr.join ''
        callback no, stdout.join ''

compileHaml = (file, callback) ->
    dir = path.dirname file
    target = "#{dir}/#{path.basename(file, '.haml')}.html"
    fs.readFile file, 'utf-8', err(callback) (content) ->
        exec 'haml -f html5', content, ret(callback)

### CSS/SASS/Compass ###

compileSass = (file, callback) ->
    dir = path.dirname file
    target = "#{dir}/#{path.basename(file, '.sass')}.css"
    exec "compass compile --sass-dir #{dir} --css-dir #{dir} --images-dir #{STATIC} -s compressed --relative-assets #{file}", err(callback) (output) ->
        log output
        fs.readFile target, 'utf-8', ret(callback)

stripExt = (file, ext) ->
    ext or = path.extname(file)
    path.join path.dirname(file), path.basename(file, ext)

### HTTP handlers ###

handleHtml = (file, res) ->
    file = stripExt file, '.html'
    pickFirst "#{STATIC}/#{file}.haml", "#{STATIC}/#{file}.html", "#{STATIC}/#{file}/index.haml", "#{STATIC}/#{file}/index.html", (error, file) ->
        if error then return notFound(res)
        if path.extname(file) == '.haml'
            compileHaml file, err(log) write(res, 'text/html')
        else
            writeFile res, file, 'text/html'

handleCss = (file, res) ->
    pickFirst "#{STATIC}/#{file}.sass", "#{STATIC}/#{file}.css", (error, file) ->
        if error then return notFound(res)
        if path.extname(file) == '.sass'
            compileSass file, err(log) write(res, 'text/css')
        else
            writeFile res, file, 'text/css'

handleJs = (file, res) ->
    loadJs "#{STATIC}/#{file}", err(log) write(res, 'application/x-javascript')

handlers = [
    [/^\/((.+\/)*.+)\.css/, handleCss]
    [/^\/((.+\/)*.+)\.js/, handleJs]
    [/^\/((.+\/)*.*)(\.html)?/, handleHtml]
]

server = (req, res) ->
    log "#{req.method} #{req.url}"
    for [rule, handler] in handlers
        matches = req.url.match rule
        if matches
            return handler matches[1], res
    log 'Not found!'
    notFound(res)

http.createServer(server).listen(PORT)
log "Barista development server listening on http://localhost:#{PORT}/"