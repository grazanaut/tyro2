// equals(a, b);
// notEqual(a, b);
// ok(a);
// raises(func);

module("Tyro.Controller#constructor");


test("Tyro.Routes is a constructor function", function() {


});



module("Tyro.Controller", {

  setup: function() {

    this.model = {model: "model"};

    this.controller = new Tyro.Controller({
      routes: {
        addRoute: sinon.spy(),
        setHash: sinon.spy()
      },
      app: { 
        pageController: {
          render: sinon.spy(),
          addChildView: sinon.spy()
        }
      },
      viewManager: {
        getParentView: sinon.spy()
      }
    });

    this.controller.handler = sinon.spy();

    $.subscribe = sinon.spy();
    $.publish = sinon.spy();

  },

  teardown: function() {

    this.controller = null;
    delete this.controller;

    delete $.subscribe;
    delete $.publish;
  }
});


test("Tyro.Controller#addRoute registers a method with this.app.routes by method name", function() {

  var route = "/a/route";

  this.controller.addRoute(route, "handler");
  ok(this.controller.routes.addRoute.calledOnce);
  equals(this.controller.routes.addRoute.args[0][0], route);
  equals(typeof this.controller.routes.addRoute.args[0][1], "function");

});


test("Tyro.Controller#addRoute registers a method with this.app.routes", function() {

  var route = "/a/route";

  this.controller.addRoute(route, this.controller.handler);
  ok(this.controller.routes.addRoute.calledOnce);
  equals(this.controller.routes.addRoute.args[0][0], route);
  equals(typeof this.controller.routes.addRoute.args[0][1], "function");
  
});


test("Tyro.Controller#addRoute throws an error if no function specified", function() {

  var route = "/a/route", controller = this.controller;

  raises(function(){
    controller.addRoute(route, this.controller.notKnown);
  });
  
});


test("Tyro.Controller#addRoute passes options through if they are specified", function() {

  var route = "/a/route", options = {type: "test"};

  this.controller.addRoute(route, this.controller.handler, options);
  equals(this.controller.routes.addRoute.args[0][2], options);
  
});




test("Tyro.Controller#getViewIndex throws a wobbler", function() {

  var controller = this.controller;

  raises(function() {
    controller.getViewIndex();
  });
  
});



test("Tyro.Controller#redirect calls routes.setHash on the app", function() {

  var route = "/a/route";

  this.controller.redirect(route);
  ok(this.controller.routes.setHash.calledOnce);
  equals(this.controller.routes.setHash.args[0][0], route);
  
});




test("Tyro.Controller#setActiveView calls activateView and getViewIndex on itself", function() {

  var view = {
    activate: sinon.stub(),
    showLoader: sinon.stub()
  };

  sinon.stub(this.controller, "setParentView");
  sinon.stub(this.controller, "getViewIndex").returns("sectionTest");

  this.controller.setActiveView(view);

  ok(this.controller.setParentView.calledOnce);
  ok(this.controller.getViewIndex.calledOnce);
  equals(this.controller.setParentView.args[0][0], view);
  equals(this.controller.setParentView.args[0][1], "sectionTest");
  
});


test("Tyro.Controller#setActiveView sets the active view", function() {

  var view = {
    activate: sinon.stub(),
    showLoader: sinon.stub()
  };

  sinon.stub(this.controller, "setParentView");
  sinon.stub(this.controller, "getViewIndex").returns("sectionTest");

  this.controller.setActiveView(view);

  equals(this.controller.activeView, view);
  
});


test("Tyro.Controller#setActiveView calls view.activate", function() {

  var view = {
    activate: sinon.stub(),
    showLoader: sinon.stub()
  };

  sinon.stub(this.controller, "setParentView");
  sinon.stub(this.controller, "getViewIndex").returns("sectionTest");

  this.controller.setActiveView(view);

  ok(view.activate.calledOnce);
  
});



test("Tyro.Controller#setActiveView calls view.showLoader", function() {

  var view = {
    activate: sinon.stub(),
    showLoader: sinon.stub()
  };

  sinon.stub(this.controller, "setParentView");
  sinon.stub(this.controller, "getViewIndex").returns("sectionTest");

  this.controller.setActiveView(view);

  ok(view.showLoader.calledOnce);
  
});



test("Tyro.Controller#subscribe registers a method with $.subscribe", function() {

  var channel = "/a/channel";

  this.controller.subscribe(channel, "handler");
  ok($.subscribe.calledOnce);
  equals($.subscribe.args[0][0], channel);
  equals(typeof $.subscribe.args[0][1], "function");

});



test("Tyro.Controller#subscribe registers a method with $.subscribe", function() {

  var channel = "/a/channel";

  this.controller.subscribe(channel, this.controller.handler);
  ok($.subscribe.calledOnce);
  equals($.subscribe.args[0][0], channel);
  equals(typeof $.subscribe.args[0][1], "function");

});

test("Tyro.Controller#publish publishes via $.publish", function() {

  var channel = "/a/channel", data = ["dog", "cat"];

  this.controller.publish(channel, data);
  ok($.publish.calledOnce);
  equals($.publish.args[0][0], channel);
  equals($.publish.args[0][1], data);

});



test("Tyro.Controller#subscribe registers a method with $.subscribe", function() {

  var channel = "/a/channel";

  this.controller.subscribe(channel, this.controller.handler);
  ok($.subscribe.calledOnce);
  equals($.subscribe.args[0][0], channel);
  equals(typeof $.subscribe.args[0][1], "function");

});

test("Tyro.Controller#subscribe throws an error if no function specified", function() {

  var channel = "/a/channel", controller = this.controller;

  raises(function(){
    controller.subscribe(channel, this.controller.notKnown);
  });
  
});



test("Tyro.Controller#_autoBindRoutes registers binds methods of itself by calling addRoute", function() {

  var route1 = "/a/route",
      route2 = "/another/route";

  this.controller[route1] = sinon.spy();
  this.controller[route2] = "handler";

  sinon.stub(this.controller, "addRoute");

  this.controller._autoBindRoutes();

  ok(this.controller.addRoute.calledTwice);
  equals(this.controller.addRoute.args[0][0], route1);
  equals(typeof this.controller.addRoute.args[0][1], "function");

  equals(this.controller.addRoute.args[1][0], route2);
  equals(typeof this.controller.addRoute.args[1][1], "function");

});

