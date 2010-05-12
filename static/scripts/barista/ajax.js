(function($, B, undefined) {

    $.ajaxSetup({ contentType: "application/x-www-form-urlencoded" });

    function disable(el) {
        return el.removeClass('enabled').not('.botbutton').attr('disabled','disabled');
    }
    function enable(el) {
        if (!el.data('disabled')) el.addClass('enabled').not('.botbutton').removeAttr('disabled');
        return el;
    }

    function isForm(el) {
        return el[0].tagName && el.is('form');
    }
    function startLoading(el) {
        if (isForm(el)) {
            var button = el.find('button.action');
            if (button.length) {
                el.data('button', button);
                if (!el.attr('enabled')) el.data('disabled', true);
                disable(button).addClass('loading');
            }
        }
        if (el.is('.loadable')) el.addClass('loading');
    }
    function stopLoading(el) {
        if (isForm(el) && el.data('button')) {
            enable(el.data('button')).removeClass('loading');
            el.data('button', undefined);
        }
        if (el.is('.loadable')) el.removeClass('loading');
    }

    function ajaxComplete() {
        var el = this;
        var requests = el.data('xhr_requests');
        requests--;
        if (requests == 0) {
            stopLoading(el);
            el.data('ajax_requests', []);
        }
        var requests = el.data('xhr_requests', requests);
    }

    function ajaxRequest(el, url, method, data, callback, dataType, contentType, ignoreError) {

        if (url.indexOf('undefined') >= 0) throw "Undefined in url " + url;

        if (!callback) {
            callback = function(response, success) {
                if (!success) return;
                $(this).fill(response);
            };
        }
        var requests = el.data('xhr_requests') || 0;
        if (requests == 0) {
            startLoading(el);
        }
        el.data('xhr_requests', requests+1);

        return $.ajax({
            type: method,
            dataType: dataType || 'json',
            contentType: contentType,
            url: url,
            data: data,
            success: function(resp) {
                if (!resp) {
                    callback.call(el, { error: 'canceled', reason: 'The request has been canceled.' }, false, true );
                    return ajaxComplete.call(el);
                }

                var success = resp.ok || (resp.error === undefined);
                if (!success && (!ignoreError)) B.message(resp.reason);
                callback.call(el, resp, success);
            },
            error: function(xhr, textStatus, errorThrown) {
                // request canceled
                if (textStatus == 'parsererror') {
                    callback.call(el, { error: 'canceled', reason: 'The request has been canceled.' }, false, true );
                    return ajaxComplete.call(el);
                }

                if (textStatus == 'timeout') {
                    if (!ignoreError) B.message('Could not connect to the server.');
                    callback.call(el, { error: 'timeout', reason: 'Could not connect to the server.' }, false);
                    return;
                }
                if (xhr.responseText.length == 0) throw "Empty response from server.";
                var json;
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    if (!ignoreError) B.message('Invalid response from server.');
                    callback.call(el, { error: 'invalid_response', reason: 'Invalid response from server.', response: xhr.responseText }, false);
                }
                if (json !== undefined) {
                    if (json.error == 'credentials_expired') {
                        $('#root').trigger({type:'logout', reason: json.reason });
                        return;
                    }
                    if (!ignoreError) B.message(json.reason);

                    callback.call(el, { error: json.error, reason: json.reason, json: json, response: xhr.responseText }, false);

                }

            },
            complete: function() { ajaxComplete.call(el); }
        });
    };

    $.fn.abort = function() {
        stopLoading($(this));
        var ajaxRequests = this.data('ajax_requests') || [];
        $.each(ajaxRequests, function() {
            this.abort();
        });
        this.data('ajax_requests', []);
    };
    function appendRequest(el, xhr) {
        var ajaxRequests = el.data('ajax_requests') || [];
        ajaxRequests.push(xhr);
        el.data('ajax_requests', ajaxRequests);
    }
    $.fn.load = function(url, data, callback, ignoreError) {
        var xhr = ajaxRequest(this, url, 'GET', data, callback, undefined, undefined, ignoreError);
        appendRequest(this, xhr);
        return xhr;
    };
    $.fn.loadHtml = function(url, data, callback, ignoreError) {
        return ajaxRequest(this, url, 'GET', data, callback, 'html', undefined, ignoreError);
    };
    $.fn.loadHtmlCached = function(url, data, callback, ignoreError) {
        var el = this;
        return B.cache(url,
                       function(cb) {
                           return ajaxRequest(el, url, 'GET', data, cb, 'html', undefined, ignoreError);
                       },
                       callback
                      );

    };
    $.fn.loadp = function(url, data, callback) {
        return ajaxRequest(this, url, 'GET', data, callback, 'jsonp');
    };
    $.fn.post = function(url, data, callback, ignoreError) {
        return ajaxRequest(this, url, 'POST', data, callback, undefined, 'application/x-www-form-urlencoded', ignoreError);
    };
    $.fn.postJson = function(url, data, callback) {
        return ajaxRequest(this, url, 'POST', JSON.stringify(data), callback, 'json', 'application/json');
    };
    $.fn.put = function(url, data, callback) {
        return ajaxRequest(this, url, 'PUT', data, callback);
    };
    $.fn.putJson = function(url, data, callback) {
        return ajaxRequest(this, url, 'PUT', JSON.stringify(data), callback, 'json', 'application/json');
    };
    $.fn.del = function(url, data, callback) {
        return ajaxRequest(this, url, 'DELETE', data, callback);
    };

})(jQuery, Barista);