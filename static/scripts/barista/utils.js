(function($, B) {

    $.fn.liveExact = function(e, callback) {
        var el = this;
        return this.live(e, function(event, data) {
            var x = (event.target == this) || $.inArray(event.target, this);
            if (x >= 0) {
                return callback.call(event.target, event, data);
            }
        });
    };

    $.fn.liveSubmit = function(callback) {
        function handler(event) {
            var el = $(this);
            try {
                var pairs = el.serializeArray();
                var data = {};
                $.each(pairs, function(i, pair) {
                    data[pair.name] = pair.value;
                });
                callback.call(el, data);
            } catch (e) {
                B.debug(e);
            }
            return false;
        }
        function buttonHandler(event) {
            return handler.call($(this).parents('form:first'), event);
        }
        this.live('submit', handler);
        this.find('button[type=submit]').live('click', buttonHandler);
    };

    B.form = function(selector, handler) {
        $(selector).liveSubmit(handler);
    };

})(jQuery, Barista);