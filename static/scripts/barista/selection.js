(function($, B) {

    B.preStartHandlers.push(function() {
        B.pathLink(this.path).addClass('selected');
    });

    B.preStopHandlers.push(function() {
        B.pathLink(this.path).removeClass('selected');
    });

})(jQuery, Barista);