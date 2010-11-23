/* require "contrib/jquery" */
/* require "contrib/dotimeout" */
/* require "contrib/hashchange" */
/* require "contrib/showdown" */

var Barista = {};

Barista.debug = function(text) {
    try {
        console.log(text);
    } catch (e) {}
};

/* require "transitions" */
/* require "utils" */
/* require "cache" */
/* require "ajax" */
/* require "handler" */
/* require "selection" */
/* require "autoload" */
/* require "templating" */
/* require "templateFunctions" */

window['B'] = Barista;
