
(function($, B) {

    $.fn.showIt = function(instant, callback) {
        if (!this.is('.off')) return this;
        if (instant) {
            this.removeClass('off').css('opacity', '');
            if (callback) callback();
        } else {
            var el = this;
            this.removeClass('off').css('opacity', '0').animate({'opacity':'1.0'}, function() {
                el.css('opacity','');
                if (callback) callback();
            });
        }
        return this;
    };
    $.fn.hideIt = function(instant, callback) {
        if (this.is('.off')) return this;
        if (instant) {
            this.addClass('off').css('opacity', '');
            if (callback) callback();
            return this;
        } else {
            var el = this;
            return this.css('opacity', '1.0').animate({'opacity':'0'}, function() {
                $(el).addClass('off');
                if (callback) callback();
            });
        }
    };
    $.fn.hideIn = function(delay) {
        return this.delay(delay).animate({'opacity':'0'}, function() { $(this).remove(); });
    };

    $.fn.showFragment = function(instant) {
        $.each(this, function() {
        // don't do anything if it's already on
            if ($(this).is('.on')) return this;

            var showing = $(this);
            var hiding = $(this).siblings('.on');

        if (hiding.length == 0) {
            showing.addClass('on').showIt(instant);
        } else {
            hiding.hideIt(instant, function() {
                if (!hiding.hasClass('on')) return;
                hiding.removeClass('on').addClass('off');
                showing.addClass('on').showIt(instant);
            });
        }
        });
        return this;
    };

})(jQuery, Barista);