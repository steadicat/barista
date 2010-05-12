# Tutorial

Barista is still in flux. APIs and conventions are messy and likely
to change. Beware!

## Set up

Barista is all static files. However, for development ease and
performance reasons, some pre-processing is done on the static
files. Follow the instructions in the [set up page](#/setup) to get
a working sample site. Use that as the starting point for your own
site.

## Basic URL handling & sub-pages

The simplest Barista app is a site with multiple static pages.

Create an HTML (HAML) file like this:

    %html
      %body
        #root
          .o-default.on
            %h1 Home Page
          .o-solutions.off
            %h1 Solutions
          .o-about.off
            %h1 About
          .o-contact.off
            %h1 Contact

This is a site with four pages. If you hit `#/solutions`, for
example, the stuff under `.o-solutions` will be shown, and all the
sibling pages will be hidden. `.on` and `.off` determine what is
shown by default on first load.

You can add links to the different pages to let you test this:

    %html
      %body
        #root
           %a( href="#/" ) Home
           %a( href="#/solutions" ) Solutions
           %a( href="#/about" ) About
           %a( href="#/contact" ) Contact
           .o-default
             %h1 Home Page
           .o-solutions
             %h1 Solutions
           .o-about
             %h1 About
           .o-contact
             %h1 Contact

You should notice that Barista already takes care of a few useful things for you:

 * There are nice smooth transitions between the pages.

 * A `.selected` class is added to any link that points to the
   current page, so you can change how they look.

 * The outer structure of the page (in this case, the navigation
   links), persists from one page to the next, so you don't have to
   worry about complex mechanisms of code reuse, like template
   inclusion.

## Including HTML code dynamically

As your site grows, you might want to split your HTML into multiple
files. Add a `source` attribute to any element. When that element
needs to be shown, the HTML will be loaded and automatically
inserted into the DOM:

    %html
      %body
        #root
          %a( href="#/" ) Home
          %a( href="#/solutions" ) Solutions
          %a( href="#/about" ) About
          %a( href="#/contact" ) Contact
          .o-default.on( source="home.html" )
          .o-solutions.off( source="solutions.html" )
          .o-about.off( source="about.html" )
          .o-contact.off( source="contact.html" )

Notice a few nice things:

* A `.loading` class is added to an element while it's loading. This
  is for you to show nice loading indicators.

* Each child file only needs to contain the content of the
  page. Again, the overall site structure persists.

## Loading JSON data declaratively

Here is where things get interesting. The `data` attribute works
similarly to the `source` attribute, except that instead of loading
HTML code, it loads data from any JSON API. For example, if you want
to show the list of Cloudant team members, you can simply load it
like this:

    %ul.team( data="http://cloudant.cloudant.com/team/_all_docs" )

Nice things:

* Like with `source`, a `.loading` class is added as the data is
  loading.

* The data is only loaded when the element is shown (e.g. when
  navigating to the page that contains it).

Of course, you then have to specify what to do with the data. That's
what templating is for.

## Templating

A Barista template is a piece of HTML that lives (usually hidden) in
the DOM, with some special `.t-*` classes that specify how to expand
it with the incoming data. A `.t-example` class is simply a call to
a corresponding JS function that defines what to do, like this:
`Barista.Template.example(element, data)`.

Back to our example, you could show the list of team members like
this:

    %ul( data="http://cloudant.cloudant.com/team/_all_docs" )
      %li.t.t-teamMember Team Member Name

And define a JS function like this:

    Barista.Template.teamMember = function(el, data) {
      $.each(data.rows, function(i, member) {
        el.clone().insertBefore(el).removeClass('t').removeClass('t-teamMember').text(member.name);
      });
    };

Barista provides some useful built-in functions, which means that in most cases you don't need to write any JS code at all! This is how the previous example would look like using Barista built-ins:

    %ul( data="http://cloudant.cloudant.com/team/_all_docs" )
      .t-get-rows
        %li.t.t-item.t-text-name Team Member Name

The `.t-get-rows` simply extracts the `rows` attribute from the JSON data, and continues processing.

The `.t-item` expects an array, and clones the current element for each of the items in the array, and continues processing for each element with the current array item. Notice the little `.t` class. That's a special class that means "this element is a template, don't show this element until it's filled with data". The `.t-item` class removes it for you as it processes the element. It also makes sure that, should the data be loaded again, any previously created rows are cleared first.

Finally, the `.t-text` class takes the current data and inserts it as the text of the current element. In this case, we use `.t-text-name`, which is shorthand for `.t-get-name.t-text`.

## Path wildcards

_To do_

## JS hooks for advanced processing

_To do_

    B.handle('#/member/*', function(memberId) {
    });

    B.handleStop('#/member/*', function(memberId) {
    });

## Form handling

_To do_

    B.form('#loginForm', function(data) {
    });

## JS API

_To do_