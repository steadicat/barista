
/* jQuery Templating */

(function($, B) {

    $.fn.classes = function() {
        if (!this.length) return [];
        return $.map((this.attr('class')+'').split(' '), function(s) { return s?s:null; });
    };

    $.fn.templateClasses = function() {
        var classes = this.classes();
        var result = [];
        for (var i in classes) {
            var c = $.trim(classes[i]);
            if (c.substring(0,2) == 't-') {
                if (c.length) result.push(c);
            }
        }
        return result;
    };

    $.fn.fill = function(data, append) {
        $(this).trigger('fill');

        var classes = this.templateClasses();

        // remove old children
        if (!append) this.children('.r').remove();

        for (var i in classes) {
            var bits = classes[i].split('-');
            var f = B.Template[bits[1]];
            if (!f) {
                B.debug('Template function ' + bits[1] + ' not defined.');
            } else {
                bits.splice(0, 2, this, data);
                try {
                    var newData = f.apply(this, bits);
                    if (newData === false) return;
                    if (newData != undefined) data = newData;
                } catch (e) {
                    B.debug(e);
                    return;
                }
            }
        }

        this.keepgoing(data);

        if (this.hasClass('t')) {
            this.removeClass('t').showIt();
        }

        return this;
    };

    $.fn.repeat = function(data, cls) {
        var clone = this.clone().addClass('r').insertAfter(this);
        if (cls) clone.removeClass(cls);
        if (data) clone.fill(data);
        return clone;
    };

    $.fn.repeatBefore = function(data, cls) {
        var clone = this.clone().addClass('r').insertBefore(this);
        if (cls) clone.removeClass(cls);
        if (data) clone.fill(data);
        return clone;
    };

    $.fn.keepgoing = function(data) {
        this.children().not('.r').each(function() {
            $(this).fill(data);
        });
    };

    /*
    $('#root').live('fill', function(event) {
        $(event.target).fill(event.response);
    });
    */

})(jQuery, Barista);