(function() {
  var PORT, REQUIRE_RULE, STATIC, child_process, coffee, compileCoffee, compileHaml, compileSass, err, exec, fs, handleCss, handleHtml, handleJs, handlers, http, loadJs, log, notFound, path, pickFirst, processRequires, ret, server, stripExt, write, writeFile;
  var __slice = Array.prototype.slice;
  STATIC = 'static';
  PORT = 5678;
  fs = require('fs');
  path = require('path');
  child_process = require('child_process');
  http = require('http');
  try {
    coffee = require('coffee-script');
  } catch (e) {
    coffee = void 0;
  }
  log = function() {
    var arg, args, _i, _len, _results;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _results = [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      _results.push(arg instanceof Error ? console.log(arg.stack) : arg !== void 0 ? console.log(arg) : void 0);
    }
    return _results;
  };
  err = function(callback) {
    return function(f) {
      return function(err, result) {
        if (err) {
          return callback(err);
        } else {
          return f(result);
        }
      };
    };
  };
  ret = function(callback) {
    return function(err, result) {
      if (err) {
        return callback(err);
      } else {
        return callback(false, result);
      }
    };
  };
  pickFirst = function() {
    var callback, first, rest, _i;
    first = arguments[0], rest = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
    return path.exists(first, function(exists) {
      if (exists) {
        return callback(false, first);
      } else {
        if (!rest.length) {
          return callback("not_found");
        }
        return pickFirst.apply(pickFirst, __slice.call(rest).concat([callback]));
      }
    });
  };
  writeFile = function(res, file, type) {
    return fs.readFile(file, 'utf-8', err(log)(write(res, type)));
  };
  write = function(res, type) {
    return function(content) {
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': content.length
      });
      res.write(content);
      return res.end();
    };
  };
  notFound = function(res) {
    res.writeHead(404, {});
    res.write('Not found.');
    return res.end();
  };
  /* Javascript/CoffeeScript */
  REQUIRE_RULE = /\/\*\s+require\s+[\'\"](.+)[\'\"]\s+\*\//g;
  processRequires = function(file, content) {
    return content.replace(REQUIRE_RULE, function(str, relfile) {
      var other;
      other = path.join(path.dirname(file), relfile);
      return processRequires(other, fs.readFileSync("" + other + ".js", 'utf-8'));
    });
  };
  compileCoffee = function(file, callback) {
    return fs.readFile(file, 'utf-8', err(callback)(function(content) {
      var stack;
      try {
        return callback(false, processRequires(file, coffee.compile(content)));
      } catch (error) {
        stack = error.stack.replace(/\n/g, '\\n\\\n').replace(/"/g, '\\"');
        return callback(false, "document.body.innerHTML = \"<h3 style='color: #c30'>Error in " + file + "</h1><pre>" + stack + "</pre>\"");
      }
    }));
  };
  loadJs = function(file, callback) {
    var tries;
    if (coffee) {
      tries = ["" + file + ".coffee", "" + file + ".js"];
    } else {
      tries = ["" + file + ".js"];
    }
    return pickFirst.apply(pickFirst, __slice.call(tries).concat([err(callback)(function(file) {
      if (path.extname(file) === '.coffee') {
        return compileCoffee(file, ret(callback));
      } else {
        return fs.readFile(file, 'utf-8', err(callback)(function(content) {
          return callback(false, processRequires(file, content));
        }));
      }
    })]));
  };
  /* HTML/HAML */
  exec = function(command, input, callback) {
    var arg, args, proc, stderr, stdout, _ref;
    if (!callback) {
      callback = input;
      input = void 0;
    }
    _ref = command.split(' '), arg = _ref[0], args = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    proc = child_process.spawn(arg, args);
    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
    stdout = [];
    stderr = [];
    proc.stdout.on('data', function(data) {
      return stdout.push(data);
    });
    proc.stderr.on('data', function(data) {
      return stderr.push(data);
    });
    return proc.on('exit', function(code) {
      log(stderr.join(''));
      return callback(false, stdout.join(''));
    });
  };
  compileHaml = function(file, callback) {
    var dir, target;
    dir = path.dirname(file);
    target = "" + dir + "/" + (path.basename(file, '.haml')) + ".html";
    return fs.readFile(file, 'utf-8', err(callback)(function(content) {
      return exec('haml -f html5', content, ret(callback));
    }));
  };
  /* CSS/SASS/Compass */
  compileSass = function(file, callback) {
    var dir, target;
    dir = path.dirname(file);
    target = "" + dir + "/" + (path.basename(file, '.sass')) + ".css";
    return exec("compass compile --sass-dir " + dir + " --css-dir " + dir + " --images-dir " + STATIC + " -s compressed --relative-assets " + file, err(callback)(function(output) {
      log(output);
      return fs.readFile(target, 'utf-8', ret(callback));
    }));
  };
  stripExt = function(file, ext) {
    ext || (ext = path.extname(file));
    return path.join(path.dirname(file), path.basename(file, ext));
  };
  /* HTTP handlers */
  handleHtml = function(file, res) {
    file = stripExt(file, '.html');
    return pickFirst("" + STATIC + "/" + file + ".haml", "" + STATIC + "/" + file + ".html", "" + STATIC + "/" + file + "/index.haml", "" + STATIC + "/" + file + "/index.html", function(error, file) {
      if (error) {
        return notFound(res);
      }
      if (path.extname(file) === '.haml') {
        return compileHaml(file, err(log)(write(res, 'text/html')));
      } else {
        return writeFile(res, file, 'text/html');
      }
    });
  };
  handleCss = function(file, res) {
    return pickFirst("" + STATIC + "/" + file + ".sass", "" + STATIC + "/" + file + ".css", function(error, file) {
      if (error) {
        return notFound(res);
      }
      if (path.extname(file) === '.sass') {
        return compileSass(file, err(log)(write(res, 'text/css')));
      } else {
        return writeFile(res, file, 'text/css');
      }
    });
  };
  handleJs = function(file, res) {
    return loadJs("" + STATIC + "/" + file, err(log)(write(res, 'application/x-javascript')));
  };
  handlers = [[/^\/((.+\/)*.+)\.css/, handleCss], [/^\/((.+\/)*.+)\.js/, handleJs], [/^\/((.+\/)*.*)(\.html)?/, handleHtml]];
  server = function(req, res) {
    var handler, matches, rule, _i, _len, _ref;
    log("" + req.method + " " + req.url);
    for (_i = 0, _len = handlers.length; _i < _len; _i++) {
      _ref = handlers[_i], rule = _ref[0], handler = _ref[1];
      matches = req.url.match(rule);
      if (matches) {
        return handler(matches[1], res);
      }
    }
    log('Not found!');
    return notFound(res);
  };
  http.createServer(server).listen(PORT);
  log("Barista development server listening on http://localhost:" + PORT + "/");
}).call(this);
