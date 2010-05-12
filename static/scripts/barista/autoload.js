(function($, B) {

    function processEmails(el) {
        el.find('[href=mailto:]').each(function() {
            var m = $(this).text() + '@cloudant.com';
            $(this).attr('href', 'mailto:' + m).text(m);
        });
    }

    function loadSource(el, callback) {
        if (!el.attr('source')) {
            if (callback) callback();
            return;
        }
        $(el).loadHtmlCached(el.attr('source'), {}, function(response, success) {
            if (!success) return;
            el.removeAttr('source');
            el.html(response);
            processEmails(el);
            // buttons
            //el.find('input, textarea').toggleButton();
            el.trigger('loaded');
            if (callback) callback();
        });
    }

    function loadData(el) {
        var loaders = el.find('*[data]');
        loaders.each(function() {
            var el = $(this);
            var url = el[0].getAttribute('data');
            $(el).loadp(url, {}, function(response, success) {
                if (!success) return;
                //el[0].removeAttribute('data');
                $(this).fill(response);
                el.trigger('dataLoaded');
            });
        });
    }

    function findStubs(el) {
        var children = el.children().not('.off');
        var result = children.filter('*[source]');
        $.each(children, function() {
            result.add(findStubs($(this)));
        });
        return result;
    }

    function load(el, callback) {
        loadSource(el, function() {
            if (callback) callback();
            loadData(el);
            var stubs = findStubs(el);
            stubs.each(function() {
                var x = $(this);
                load(x);
            });
        });
    }

    B.preStartHandlers.push(function() {
        var r = this;
        load(this.target, function() {
            r.cont();
        });
        return false;
    });

})(jQuery, Barista);