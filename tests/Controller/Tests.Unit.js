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
      models: {
        getModel: sinon.stub().returns(this.model)
      },
      pageController: {
        render: sinon.spy(),
        addChildView: sinon.spy()
      },
      user: {},
      checkSignedIn: sinon.stub(),
      checkNotSignedIn: sinon.spy(),
      checkAccess: sinon.spy(),
      defaults: {} 
    });

    this.controller.handler = sinon.spy();

    $.subscribe = sinon.spy();

  },

  teardown: function() {

    this.controller = null;
    delete this.controller;

    delete $.subscribe;
  }
});


test("Tyro.Controller#addRoute registers a method with this.app.routes by method name", function() {

  var route = "/a/route";

  this.controller.addRoute(route, "handler");
  ok(this.controller.app.routes.addRoute.calledOnce);
  equals(this.controller.app.routes.addRoute.args[0][0], route);
  equals(typeof this.controller.app.routes.addRoute.args[0][1], "function");

});


test("Tyro.Controller#addRoute registers a method with this.app.routes", function() {

  var route = "/a/route";

  this.controller.addRoute(route, this.controller.handler);
  ok(this.controller.app.routes.addRoute.calledOnce);
  equals(this.controller.app.routes.addRoute.args[0][0], route);
  equals(typeof this.controller.app.routes.addRoute.args[0][1], "function");
  
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
  equals(this.controller.app.routes.addRoute.args[0][2], options);
  
});


test("Tyro.Controller#activateView calls render on the pageController", function() {

  var viewIndex = {viewIndex: "viewIndex"}, 
      view = {view: "view"};

  this.controller.activateView(viewIndex, view);
  ok(this.controller.app.pageController.render.calledOnce);
  equals(this.controller.app.pageController.render.args[0][0], viewIndex);
  
});


test("Tyro.Controller#activateView calls addChildView on the pageController", function() {

  var viewIndex = {viewIndex: "viewIndex"}, 
      view = {view: "view"};

  this.controller.activateView(viewIndex, view);
  ok(this.controller.app.pageController.addChildView.calledOnce);
  equals(this.controller.app.pageController.addChildView.args[0][0], viewIndex);
  equals(this.controller.app.pageController.addChildView.args[0][1], view);
  
});


test("Tyro.Controller#checkAccess calls checkAccess on the app", function() {

  var section = "sectionName";

  this.controller.checkAccess(section);
  ok(this.controller.app.checkAccess.calledOnce);
  equals(this.controller.app.checkAccess.args[0][0], section);
  
});


test("Tyro.Controller#checkNotSignedIn returns this.app.checkNotSignedIn", function() {

  var ret = this.controller.checkNotSignedIn();
  equals(this.controller.app.checkNotSignedIn, ret);
  
});


test("Tyro.Controller#checkSignedIn returns this.app.checkSignedIn", function() {

  var ret = this.controller.checkSignedIn();
  equals(this.controller.app.checkSignedIn, ret);
  
});


test("Tyro.Controller#getDefaults returns this.app.defaults", function() {

  var ret = this.controller.getDefaults();
  equals(this.controller.app.defaults, ret);
  
});


test("Tyro.Controller#getModel calls models.getModel on the app", function() {

  var model = "modelName";

  ret = this.controller.getModel(model);
  ok(this.controller.app.models.getModel.calledOnce);
  equals(this.controller.app.models.getModel.args[0][0], model);
  equals(this.model, ret);
  
});


test("Tyro.Controller#getSection returns the section property", function() {

  ret = this.controller.getSection();
  equals(undefined, ret);

  this.controller.section = "section";

  ret = this.controller.getSection();
  equals(this.controller.section, ret);
  
});



test("Tyro.Controller#redirect calls routes.setHash on the app", function() {

  var route = "/a/route";

  this.controller.redirect(route);
  ok(this.controller.app.routes.setHash.calledOnce);
  equals(this.controller.app.routes.setHash.args[0][0], route);
  
});




test("Tyro.Controller#setActiveView calls activateView and getSection on itself", function() {

  var view = {showLoader: sinon.stub()};

  sinon.stub(this.controller, "activateView");
  sinon.stub(this.controller, "getSection").returns("sectionTest");
  this.controller.setActiveView(view);

  ok(this.controller.activateView.calledOnce);
  ok(this.controller.getSection.calledOnce);
  equals(this.controller.activateView.args[0][0], "sectionTest");
  equals(this.controller.activateView.args[0][1], view);
  
});


test("Tyro.Controller#setActiveView sets the active view", function() {

  var view = {showLoader: sinon.stub()};

  this.controller.setActiveView(view);

  equals(this.controller.activeView, view);
  
});

test("Tyro.Controller#setActiveView calls activateView.showLoader", function() {

  var view = {showLoader: sinon.stub()};

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

