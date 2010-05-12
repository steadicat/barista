
Barista.Template = {};

(function($, B, T) {

    /* traversal */

    T.get = function(el, data, attr) {
        if (data == undefined) {
            throw 'Undefined data at element ' + el.get(0).tagName;
        } else if (attr) {
            if (data[attr] == undefined) {
                throw 'Undefined attribute '+attr+' of data at element ' + el.get(0).tagName + '.' + el.get(0).getAttribute('class').split(' ').join('.');
            } else {
                return data[attr];
            }
        } else {
            return data;
        }
    };

    T.index = function(el, data, arg) {
        return data[parseInt(T.get(el, data, arg))];
    };

    T.debug = function(el, data) {
        B.debug(data);
        return data;
    };

    T.stop = function(el, data) {
        return false;
    };

    /* manipulation */

    T.text = function(el, data, arg) {
        el.text(T.get(el, data, arg));
        return data;
    };

    T.html = function(el, data, arg) {
        el.html(T.get(el, data, arg));
        return data;
    };


    function processEmails(el) {
        el.find('[href=mailto:]').each(function() {
            var m = $(this).text() + '@cloudant.com';
            $(this).attr('href', 'mailto:' + m).text(m);
        });
    }

    T.markdown = function(el, data, arg) {
        var converter = new Showdown.converter;
        el.html(converter.makeHtml(T.get(el, data, arg)));
        processEmails(el);
        return data;
    };

    T.inlineMarkdown = function(el, data, arg) {
        var converter = new Showdown.converter;
        el.html($(converter.makeHtml(T.get(el, data, arg))).html());
        processEmails(el);
        return data;
    };

    T.val = function(el, data, arg) {
        el.val(T.get(el, data, arg));
        return data;
    };

    T.attr = function(el, data, name, arg) {
        el.attr(name, T.get(el, data, arg));
        return data;
    };

    T.path = function(el, data, arg) {
        el.addClass('o-' + T.get(el, data, arg));
        return data;
    };

    T.copy = function(el, data, arg) {
        var clip = new ZeroClipboard.Client();
        var s = T.get(el, data, arg);
        clip.setText(s);
        clip.setHandCursor(true);
        el.children().remove();
        el.append('<span>Copy</span>');
        var clone = el.clone().appendTo(document.body);
        var c = $(clip.getHTML(clone.width(), clone.height())).css('position', 'absolute').css('top', '0').css('left', '0').attr('title', 'Copy to clipboard');
        el.append(c);
        clip.addEventListener('onComplete', function() {
            el.find('span:first').text('Copied!');
            $.doTimeout(5000, function() {
                el.find('span:first').text('Copy');
            });
        });
        clone.remove();
    };

    function getText(el) {
        var result = [];
        el.children().each(function() {
            if ($(this).is('.input')) {
                result.push($(this).find('input').val() || '____');
            } else {
                result.push($(this).text());
            }
        });
        return result.join('');
    }

    T.copyNext = function(el, data, arg) {
        var clip = new ZeroClipboard.Client();
        var cls = arg;
        clip.setHandCursor(true);
        el.children().remove();
        el.append('<span>Copy</span>');
        var clone = el.clone().appendTo(document.body);
        var c = $(clip.getHTML(clone.width(), clone.height())).css('position', 'absolute').css('top', '0').css('left', '0').attr('title', 'Copy to clipboard');
        el.append(c);
        clip.addEventListener('onMouseDown', function() {
            clip.setText(getText(el.parent().next('.'+cls+':first')));
        });
        clip.addEventListener('onComplete', function() {
            el.find('span:first').text('Copied!');
            $.doTimeout(5000, function() {
                el.find('span:first').text('Copy');
            });
        });
        clone.remove();
    };
    /*
    T.date = function(el, data, arg) {
        el.text(prettyDate(new Date(T.get(el, data, arg))));
    };
    */

    function prettyInterval(ms) {
        var s = Math.floor(ms / 1000);
        ms = ms % 1000;
        var m = Math.floor(s / 60);
        s = s % 60;
        var h = Math.floor(m / 60);
        m = m % 60;
        var result = [];
        if (h > 0) result.push(h+'h');
        if (m > 0) result.push(m+'m');
        if (s > 0) result.push(s+'s');
        return result.join(' ');
    }
    T.interval = function(el, data, arg) {
        el.text(prettyInterval(T.get(el, data, arg)));
    };
    T.liveInterval = function(el, data, arg) {
        var timestamp = T.get(el, data, arg);
        el.addClass('liveInterval').text(prettyInterval(new Date() - timestamp)).data('liveInterval', timestamp);
        $.doTimeout('liveInterval', 1000, function() {
            $('.liveInterval').each(function() {
                var t = prettyInterval(new Date() - $(this).data('liveInterval'));
                $(this).text(t).attr('title', t);
            });
            return true;
        });
    };

    T.attrFill = function(el, data, attr, arg) {
        if (!el.data(attr)) el.data(attr, el.attr(attr));
        data = T.get(el, data, arg);
        el.attr(attr, (el.data(attr)).replace('$', data));
    };

    T.link = function(el, data, arg, raw) {
        if (!el.data('href')) el.data('href', el.attr('href'));
        data = T.get(el, data, arg);
        if (raw === undefined) data = encodeURIComponent(data);
        el.attr('href', (el.data('href')).replace('$', data));
        if ($.inArray(el[0], B.pathLinks(B.getPath())) >= 0) el.addClass('selected');
    };
    T.userLink = function(el, data, arg) {
        var href = el.data('href') || el.attr('href');
        el.data('href', href.replace('$U', Auth.getUsername()));
        T.link(el, data, arg);
    };

    T.data = function(el, data, name, arg) {
        el.data(name, T.get(el, data, arg));
        return data;
    };

    function round(n, decimals) {
        decimals = decimals || 2;
        return Math.round(n * Math.pow(10, decimals)) / Math.pow(10.0, decimals);
    }

    T.diskSize = function(el, data, arg) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var u = 0;
        var size = T.get(el, data, arg);
        while (size > 1024) {
            size = round(size/1024);
            u++;
            if (u == u.length-1) break;
        }
        el.text(size + ' ' + units[u]);
    };

    /* iteration */

    T.item = function(el, data) {
        for (var i in data) {
            if (data[i]._id && (data[i]._id.charAt(0) == '_')) continue;
            el.repeatBefore(data[i], 't-item');
        }
        return false;
    };

    T.dictionaryItem = function(el, data) {
        for (var i in data) {
            if (i.charAt(0) == '_') continue;
            el.repeatBefore({key: i, value: data[i]}, 't-dictionaryItem');
        }
        return false;
    };

    T.random = function(el, data) {
        var total = 0;
        for (var i in data) {
            if (data[i].id && data[i].id.charAt(0) == '_') continue;
            total++;
        }
        var x = Math.floor(Math.random()*total);
        var i = 0;
        for (var i in data) {
            if (data[i].id && data[i].id.charAt(0) == '_') continue;
            if (i == x) {
                //var res = {};
                //res[k] = data[k];
                return data[i];
            }
            i++;
        }
        return false;
    };

    /* conditionals */

    T.ifEmpty = function(el, data) {
        if (data.length == 0) {
            el.showIt();
        } else {
            el.hideIt();
        }
    };
    T.when = function(el, data, attr, hideOnly) {
        if ((data[attr] !== undefined) && T.get(el, data, attr) !== undefined) {
            el.showIt(true);
        } else {
            el.hideIt(true);
            if (!hideOnly) return false;
        }
        return data;
    };
    T.whenNot = function(el, data, attr, hideOnly) {
        if ((data[attr] === undefined) || T.get(el, data, attr) === undefined) {
            el.showIt(true);
        } else {
            el.hideIt(true);
            if (!hideOnly) return false;
        }
        return data;
    };

    T.ifSelected = function(el, data, attr, dataId) {
        if (dataId === undefined) { attr = dataId; dataId = undefined; }
        var current = $(document.body).data(dataId);
        if (current == T.get(el, data, attr)) {
            el.removeClass('off');
        } else {
            el.addClass('off');
        }
    };

    T.ifNotSelected = function(el, data, attr, dataId) {
        if (dataId === undefined) { attr = dataId; dataId = undefined; }
        var current = $(document.body).data(dataId);
        if (current == T.get(el, data, attr)) {
            el.addClass('off');
        } else {
            el.removeClass('off');
        }
    };

    function processEmails(el) {
        el.find('[href=mailto:]').each(function() {
            var m = $(this).text() + '@cloudant.com';
            $(this).attr('href', 'mailto:' + m).text(m);
        });
    }

    T.email = function(el, data) {
        processEmails(el);
    };

})(jQuery, Barista, Barista.Template);