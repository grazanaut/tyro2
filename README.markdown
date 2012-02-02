Tyro2
======

In a sentence (or two)
----------------------

Tyro is another (super-lightweight) JavaScript (MVC) framework inspired by Backbone, CorMVC and Sammy.

Tyro2 is a fork of Tyro which modifies some naming conventions and code within the Page Controller. Forked and renamed because this modifies the external interface

TODO!!
======

* Make libraries pluggable, so jQuery is default but others can be plugged in instead - done in such a way that jQuery is not even referenced if not used
* Refactor some of the base controller stuff out into an app-specific base controller which inherits from this
* Remove PageController completely
* Write more tests
* Move some more platform-js-backoffice BaseView code into Tyro.View if it is generic enough
* render method or similar should check that a parent view actually contains the container the child requires, somehow... (so child doesnt replace parent's parent,etc if wrong heirarchy defined)
* move tests into correct modules (eg Tyro.View tests test things other than View)
* edit this README (example at bottom is incorrect, and recommendation of jqt and $.pubsub is not necessarily our recommendation anymore, although pubsub/observer patterns certainly are)


In slightly more detail
-----------------------

Tyro aids in building single page web applications without prescribing too much!

Tyro lets you, the developer decide how to structure your application - after all, it should be designed and built to your custom specification. Technically speaking, you could use Tyro without any models and views and instead munge all the layers into the controllers, but of course we don't advise this!

Dependencies
------------

Tyro has a few dependencies, but these could easily be ripped / swapped out and changed to whatever you want. Currently Tyro is built on top of [jQuery](http://www.jquery.com) and [jQuery.HashChange](http://benalman.com/projects/jquery-hashchange-plugin/)  (you know the guy that wrote jQuery BBQ).

Okay, Okay, so technically what does Tyro currently provide?
------------------------------------------------------------

- Reacting to hash changes via 'routes'
- Kicking off controllers
- Setting the hash value

Doesn't sound like much does it?
--------------------------------

As we said, it's tiny but that coupled with an example app (still todo) should show you how easy it is to build a lovely, architected, MVC single page web application.

What else do we suggest?
------------------------

It's completely up to you how you build your application but we have to recommend the following:

- jQuery Templates (they are super awesome)
- jQuery PubSub (useful to get your application talking to each without coupling)

A very simple quick start guide
-------------------------------

    new Tyro({
        pageNotFoundUrl: "/404",
        routeMatched: function(url) {
            // do something if you want
            
            // in our example we are publishing an event that the url was changed, so that lots of
            // different views can update themselves based on the current matched url. Useful for
            // highlighting the current menu item.
        }
    })