(function($, B, undefined) {

    B.preStartHandlers = [];
    B.postStartHandlers = [];
    B.preStopHandlers = [];
    B.postStopHandlers = [];

    function triggerHandlers(handlers, target, cont, path, args, i) {
        i = i || 0;
        if (i >= handlers.length) return cont();

        var go;
        go = handlers[i].apply({ target: target, cont: function() { triggerHandlers(handlers, target, cont, path, args, i+1) }, skip: cont, path: path }, args);

        if (go !== false) {
            return triggerHandlers(handlers, target, cont, path, args, i+1);
        }
    };

    function start(el, path, breadcrumb, args, callback, instant, refresh) {

        if (!refresh && (!el.length || el.hasClass('on'))) {
            if (callback) callback();
            return;
        }

        function cont() {
            el.showFragment(instant);
            if (callback) $.doTimeout(0, callback);
        };

        var handlers = B.preStartHandlers.concat(
            startHandlers[breadcrumb] === undefined ? [] : startHandlers[breadcrumb],
            B.postStartHandlers);

        triggerHandlers(handlers, el, cont, path, args);
    }

    function stop(path, breadcrumb, args) {
        var el = elementFromPath(breadcrumb);
        function cont() {}

        var handlers = B.preStopHandlers.concat(
            stopHandlers[breadcrumb] === undefined ? [] : stopHandlers[breadcrumb],
            B.postStopHandlers);

        triggerHandlers(handlers, el, cont, path, args);
    }

    var lastBreadcrumb = [];
    var lastSplitPath = [];
    var lastArgs = [];

    function stopLast(start) {
        stop(joinPath(lastSplitPath, true), joinPath(lastBreadcrumb, true), lastArgs);
        var a = lastArgs.length;
        for (var i=lastBreadcrumb.length; i>=start; i--) {
            if (lastBreadcrumb[i] == '*') a--;
            stop(joinPath(lastSplitPath.slice(0,i)), joinPath(lastBreadcrumb.slice(0,i)), lastArgs.slice(0,a));
        }
    }

    function innerHandle(el, path, lastPath, i, breadcrumb, args, instant, refresh) {
        start(el, joinPath(path.slice(0,i)), joinPath(breadcrumb), args, function() {
            if (path.length == i) {
                var def = findDefault(el);
                if (def) {
                    if (lastPath.length > path.length) refresh=true;
                    stopLast(i+1);
                    start(def, joinPath(path.slice(0,i), true), joinPath(breadcrumb.slice(0,i), true), args, undefined, instant, refresh);
                }
                lastBreadcrumb = breadcrumb;
                lastSplitPath = path;
                lastArgs = args;
                return;
            }

            var child = findChild(el, path[i]);
            if (!refresh && !child.hasClass('on')) {
                refresh = true;
                stopLast(i+1);
            }
            if (child.hasClass('o--')) {
                if (!refresh && ((!lastSplitPath[i]) || (lastSplitPath[i] != path[i]))) {
                    refresh = true;
                    stopLast(i+1);
                }
                args.push(decodeURIComponent(path[i]));
                breadcrumb.push('*');
            } else {
                breadcrumb.push(path[i]);
            }

            innerHandle(child, path, lastPath, i+1, breadcrumb, args, instant, refresh);

        }, instant, refresh);
    }

    function handle(path, lastPath, instant, forceRefresh) {
        if (!$('#root').length) throw 'Page not found (no root element).';

        innerHandle($('#root'), splitPath(path), splitPath(lastPath), 0, [], [], instant, forceRefresh);
    }

    function findChild(el, bit) {
        var child = el.find('.o-' + bit + ':first');
        if (child.length) return child;
        child = el.find('.o--:first');
        if (child.length) return child;
        B.message('Page "'+ bit +'" not found.');
        throw 'Page "'+ bit +'" not found.';
    }

    function findDefault(el) {
        // find the default if present
        var child = el.find('.o-default:first');
        if (child.length) {
            return child;
        }
    }

    function elementFromPath(path) {
        return elementFromSplitPath(splitPath(path), -1, path[path.length-1]=='/');
    }

    function elementFromSplitPath(bits, depth, findDefault) {
        // build the chain of selectors
        bits = $.map(bits, function(bit) { return '.o-' + ( bit == '*' ? '-' : bit ) + ':first'; });

        if (depth >= 0) bits = bits.slice(0, depth);
        bits.unshift('#root');

        if (findDefault) bits.push('.o-default:first');

        return $(bits.join(' '));
    }

    function splitPath(path) {
        if (path.charAt(0) == '#') path = path.substring(1);
        if (path.charAt(0) == '!') path = path.substring(1);
        if (path.charAt(0) == '/') path = path.substring(1);
        if (path.charAt(path.length-1) == '/') path = path.substring(0, path.length-1);
        return path ? path.split('/') : [];
    }

    function joinPath(bits, def) {
        return ['#', [''].concat(bits).join('/'), def ? '/' : ''].join('');
    }

    var lastPath;

    function hashChanged(path, refresh) {
        if (path === undefined) path = B.getPath();

        if (refresh || (lastPath !== path)) {
            var instant = (lastPath === undefined);
            handle(path, lastPath || '', instant, refresh);
            lastPath = path;
        }
    }

    $('a').live('click', function() {
        var href = $(this).attr('href');
        if (!href) return;
    });

    // exposed functions

    B.getPath = function() {
        var start = location.href.indexOf('#');
        if (start < 0) return '';
        return location.href.substring(start);
    };

    B.redirect = function(path, refresh, instant) {
        $.doTimeout('pageHandler');
        location.hash = path;
        //instant = instant || (lastPath === undefined);
        //handle(path, lastPath, instant, refresh);
        //lastPath = path;
    };

    // find the element matching a path
    B.path = function(path) {
        var findDefault = (path[path.length-1] == '/');
        var bits = splitPath(path);
        return elementFromSplitPath(bits, -1, findDefault);
    };

    B.pathLink = function(path) {
        return $('a[href=' + path + ']');
    }
    // find all elements linking to a path or an ancestor
    B.pathLinks = function(path) {
        if (path === undefined) return $();

        var selectors = [];
        var bits = splitPath(path);
        for (var i=0; i<=bits.length; i++) {
            selectors.push('a[href=' + joinPath(bits.slice(0, i)) + ']');
        }
        selectors.push('a[href=' + joinPath(bits, true) + ']');

        if (bits.length == 0) selectors.push('a[href=#/]');

        return $(selectors.join(','));
    }

    var startHandlers = {};
    B.handle = function(path, callback) {
        if (startHandlers[path] === undefined) startHandlers[path] = [];
        startHandlers[path].push(callback);
    };

    var stopHandlers = {};
    B.handleStop = function(path, callback) {
        if (stopHandlers[path] === undefined) stopHandlers[path] = [];
        stopHandlers[path].push(callback);
    };

    // init

    $(window).bind('hashchange', function() { hashChanged(); });

    B.start = function() {
        hashChanged();
    }

})(jQuery, Barista);
