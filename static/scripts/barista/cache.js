(function(B) {

    B.store = {};

    B.cache = function(key, input, output) {
        var cached = B.store[key];
        if (cached !== undefined) {
            output.apply(cached[1], cached[2]);
            return cached[0];
        }
        var t;
        var a;
        var r = input(function() {
            t = this;
            a = Array.prototype.slice.apply(arguments);
            output.apply(t, a);
        });
        B.store[key] = [r, t, a];
        return r;
    }

})(Barista);