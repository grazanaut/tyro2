/*
loggedIn -> loggedOut

- teardown non attached active (loggedIn)
- render in-active parents (loggedOut)

loggedIn, dashboard -> loggedOut

- teardown non attached active (loggedIn, dashboard)
- render in-active parents (loggedOut)

loggedIn, setup -> loggedIn, dashboard

- teardown non attached active (NONE)
- teardown everything below top level active partial-view (below loggedIn - setup)
- render in-active parents (dashboard)

loggedIn, setup, campaigns -> loggedIn, setup

- teardown non attached active (NONE)
- teardown everything below top level active partial-view (below setup - campaigns)
- render in-active parents (NONE)

loggedIn, dashboard -> loggedIn, setup, campaigns

- teardown non attached active (NONE)
- teardown everything below top level active partial-view (below loggedIn - dashboard)
- render in-active parents (setup, campaigns)
*/

var fixtures = {};

fixtures.MockView = function(container) {
    this.render = function(){};
    this.teardown = function(){};
    this.container = container;
};
fixtures.getCopyOfMain = function(){
  var MockView = fixtures.MockView;
  var f = {};
  f.loggedOut = new Tyro.PartialViewCollectionItem("loggedOut", null, new MockView("some container"));
  f.loggedIn = new Tyro.PartialViewCollectionItem("loggedIn", null, new MockView("some container"));
  f.dashboard = new Tyro.PartialViewCollectionItem("dashboard", f.loggedIn, new MockView("#main"));
  f.setup = new Tyro.PartialViewCollectionItem("setup", f.loggedIn, new MockView("#main"));
  f.campaigns = new Tyro.PartialViewCollectionItem("campaigns", f.setup, new MockView("some container"));
  return f;
};
fixtures.main = fixtures.getCopyOfMain(); //backward-compatibility


function stubFn(returnValue, arrayToPopulate) {
  var fn = function () {
    fn.called = true;
    fn.args = arguments;
    fn.thisValue = this;
    fn.callCount++;
		
		if(arrayToPopulate) arrayToPopulate.push(fn);
		
    return returnValue;
  };

  fn.called = false;
  fn.callCount = 0;

  return fn;
}

module("new Tyro.PageController()");

test("Tyro.PageController is a constructor function", function() {
  equals(typeof Tyro.PageController, "function", "Tyro.PageController is of type function.");
});

test("Every instance of Tyro.PageController should have a partialViews object property.", function() {
  var pc = new Tyro.PageController();
	equals(typeof pc.partialViews, "object");
});

module("new Tyro.PartialViewCollectionItem()");

test("When instantiating without an 'id' argument an error is thrown.", function() {
	raises(function() {
		new Tyro.PartialViewCollectionItem(null, null, new fixtures.MockView("some container"));
	}, "raised");
});

test("When instantiating with a 'parent' argument that is not null and is not a PartialViewCollectionItem an error is thrown.", function() {
	raises(function() {
		new Tyro.PartialViewCollectionItem("some id", {}, new fixtures.MockView("some container"));
	}, "raised");
});

test("When instantiating with a 'view' argument that is not null and is not a valid view an error is thrown.", function() {
	raises(function() {
		new Tyro.PartialViewCollectionItem("some id", null, {});
	}, "raised");

  raises(function() {
    new Tyro.PartialViewCollectionItem("some id", null, {render: function() {}});
  }, "raised");

  raises(function() {
    new Tyro.PartialViewCollectionItem("some id", null, {render: function() {}, teardown: function() {}});
  }, "raised");
});

test("When instantiating with a null 'parent' argument no error is thrown.", function() {
	var item = new Tyro.PartialViewCollectionItem("some id", null, new fixtures.MockView("some container"));
  equals(item instanceof Tyro.PartialViewCollectionItem, true);
});

test("When instantiating with a valid 'parent' argument no error is thrown.", function() {
	var item = new Tyro.PartialViewCollectionItem("some id", null, new fixtures.MockView("some container"));
  var item2 = new Tyro.PartialViewCollectionItem("some id2", item, new fixtures.MockView("some container2"));
  equals(item2 instanceof Tyro.PartialViewCollectionItem, true);
});

module("addPartialView()");

test("Every instance of Tyro.PageController should have an addPartialView() method.", function() {
	var pc = new Tyro.PageController();
	equals(typeof pc.addPartialView, "function");
});

test("When adding a partial-view with no arguments an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView();
	}, "raised");
});

test("When adding a partial-view with argument that is not a Tyro.PartialViewCollectionItem an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({});
	}, "raised");
});

test("When adding a partial-view with argument that is a Tyro.PartialViewCollectionItem no error is thrown.", function() {
	var pc = new Tyro.PageController();
	pc.addPartialView(fixtures.getCopyOfMain().loggedIn);
  equals(true, true);
});


test("When adding a valid partialView it should be added to the partialViews collection.", function() {
	var pc = new Tyro.PageController();
	pc.addPartialView(fixtures.getCopyOfMain().setup);
	
	equals(typeof pc.partialViews["setup"], "object");
	
});

module("getPartialViewsChildrenActive()");

test("This should return the active children partial-views as an array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	
	var result = pc.getPartialViewsChildrenActive("loggedIn");
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
	equals(result[0] === pc.partialViews["campaigns"], true);
	equals(result[1] === pc.partialViews["setup"], true);
});

test("This should return the active children partial-views as an array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	
	var result = pc.getPartialViewsChildrenActive("setup");
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
	equals(result[0] === pc.partialViews["campaigns"], true);
	
	var result2 = pc.getPartialViewsChildrenActive("campaigns");
	equals(result2.length, 0);
	
});

module("getPartialViewsNonAttachedActive()");

test("When no partial-view is specificed, an empty array should be returned.", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = fixtures.getCopyOfMain();
	var result = pc.getPartialViewsNonAttachedActive();
	ok($.isArray(result));
});

test("When one non attached partial-view is active, that partial-view should be returned in an array.", function() {
	var pc = new Tyro.PageController();	
  pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["loggedOut"].active = true;
	var result = pc.getPartialViewsNonAttachedActive("setup");
	equals(result[0], pc.partialViews["loggedOut"]);
});

test("When there are multiple non attached active partial-views, they should be returned in an array.", function() {
	var pc = new Tyro.PageController();	
  pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["dashboard"].active = true;
	var result = pc.getPartialViewsNonAttachedActive("loggedOut");
	equals(result.length, 2);
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
	equals(result[0] === pc.partialViews["dashboard"], true);
	equals(result[1] === pc.partialViews["loggedIn"], true);
});

test("When there are no non attached active partial-views, it should return an empty array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var setupHomeView = { teardown: stubFn() }
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["setup"].childViews[setupHomeView];
	
	var result = pc.getPartialViewsNonAttachedActive("campaigns");
	
	equals(result.length, 0);

});

test("When getting non attached active partial-views it should return them in child-to-parent order.", function() {
  var pc = new Tyro.PageController();
  pc.partialViews = fixtures.getCopyOfMain();
  pc.partialViews["loggedIn"].active = true;
  pc.partialViews["setup"].active = true;
  pc.partialViews["campaigns"].active = true;
  
  var result = pc.getPartialViewsNonAttachedActive("loggedOut");
  
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
  equals(result[0] === pc.partialViews["campaigns"], true);
  equals(result[1] === pc.partialViews["setup"], true);
  equals(result[2] === pc.partialViews["loggedIn"], true);
});

module("getPartialViewsInActiveParents()");

test("Every instance of Tyro.PageController should have a getPartialViewsInActiveParents() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.getPartialViewsInActiveParents, "function");
});

test("When there are partial-views that are inactive and parents it should return them in an array.", function() {
	var pc = new Tyro.PageController();	
	
	pc.partialViews = fixtures.getCopyOfMain();
	var result1 = pc.getPartialViewsInActiveParents("loggedOut");
	equals(result1.length, 1);
	equals(result1[0], pc.partialViews["loggedOut"]);
	
	//1
	pc.partialViews = fixtures.getCopyOfMain();
	var result2 = pc.getPartialViewsInActiveParents("dashboard");
	equals(result2.length, 2);
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
	equals(result2[0] === pc.partialViews["loggedIn"], true);
	equals(result2[1] === pc.partialViews["dashboard"], true);
	
	//2
	pc.partialViews = fixtures.getCopyOfMain();
	var result3 = pc.getPartialViewsInActiveParents("campaigns");
	equals(result3.length, 3);
  //need to use === and true here, as equals() does deep check and ends up in infinite recursion due to
  //double-linked-tree structure
	equals(result3[0] === pc.partialViews["loggedIn"], true);
	equals(result3[1] === pc.partialViews["setup"], true);
	equals(result3[2] === pc.partialViews["campaigns"], true);
	
});

module("teardownPartialView()");

test("Every instance of Tyro.PageController should have a teardownPartialView() method", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.teardownPartialView, "function");
});

test("When tearing down a partial-view it should call teardown on it's childViews and then it's own view.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews["setup"] = $.extend(true,{}, fixtures.main["setup"]);
	pc.partialViews["setup"].active = true;
	var func = stubFn();
	pc.partialViews["setup"].childViews = [{teardown: func}];
	pc.partialViews["setup"].view.teardown = stubFn();
	// exercise
	pc.teardownPartialView("setup");
	
	// verify	
	ok(func.called);
	ok(pc.partialViews["setup"].view.teardown.called);
	equals(pc.partialViews["setup"].active, false);
	equals(pc.partialViews["setup"].childViews.length, 0);
	
});

module("teardownPartialViews()");

test("Every instance of Tyro.PageController should have a teardownPartialViews() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.teardownPartialViews, "function");
});

test("When tearing down many partial-views, it should delegate to the teardownPartialView() method.", function() {
	var pc = new Tyro.PageController();
	pc.teardownPartialView = stubFn();
	pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["setup"].active = true;
	pc.partialViews["loggedIn"].active = true;
	var arr = [pc.partialViews["setup"], pc.partialViews["loggedIn"]]
	
	pc.teardownPartialViews(arr);
	
	equals(pc.teardownPartialView.callCount, 2);
	equals(pc.teardownPartialView.args[0], "loggedIn");
});

module("teardownChildView()");

test("todo", function(){});

module("addChildView()");

test("Every instance of Tyro.PageController should have an addChildView() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.addChildView, "function");
});

test("When adding a child view without specifying a view to add, it should throw an error.", function() {
  var pc = new Tyro.PageController();
  raises(function() {
		pc.addChildView("setup");
	}, "raised");
});

test("When adding a view without a container it should throw an error.", function() {
  var pc = new Tyro.PageController();
  raises(function() {
		pc.addChildView("setup", {});
	}, "raised");
});

test("When adding a view without a teardown method it should throw an error.", function() {
  var pc = new Tyro.PageController();
  raises(function() {
		pc.addChildView("setup", {container: "container"});
	}, "raised");
});

test("When adding a view to a partial-view it should be added to it's childViews array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	
	var view = {
		render: stubFn(),
		teardown: stubFn(),
		container: "woop"
	}
	pc.addChildView("setup", view);
	
	equals(pc.partialViews["setup"].childViews.length, 1);
	equals(pc.partialViews["setup"].childViews[0], view);
	
});

test("When adding a view that has the same container as a view already in the partial-views childViews array, teardown and remove it first.",  function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var view1 = { teardown: stubFn(), container: "container1" };
	var view2 = { teardown: stubFn(), container: "container2" };
	var view3 = { teardown: stubFn(), container: "container1" };
	pc.partialViews["setup"].childViews = [view1, view2];

	pc.addChildView("setup", view3);

	ok(view1.teardown.called);
	ok(!view2.teardown.called);
	
	equals(pc.partialViews["setup"].childViews.length, 2);
	
})

module("isPartialViewActive()");

test("Every instance of Tyro.PageController should have an isPartialViewActive() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.isPartialViewActive, "function");
});

test("When a view is active, this should return true", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["setup"].active = true;
	var result = pc.isPartialViewActive("setup");
	
	ok(result);
});

test("When a view is active, this should return true", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var result = pc.isPartialViewActive("setup");
	
	ok(!result);
});

module("renderPartialViews()");

test("Every instance of Tyro.PageController should have a renderPartialViews() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.renderPartialViews, "function");
});

test("When invoking this method, it should render each of the partial-views view and set to active", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var pvRender1 = stubFn();
	var pvRender2 = stubFn();
	pc.partialViews["loggedIn"].view = { render: pvRender1 };
	pc.partialViews["setup"].view = {	render: pvRender2 };


	pc.renderPartialViews([pc.partialViews["loggedIn"], pc.partialViews["setup"]]);

	ok(pvRender1.called);
	ok(pc.partialViews["loggedIn"].active);
	ok(pvRender2.called);
	ok(pc.partialViews["setup"].active);
});

module("render() - general");

test("Every instance of Tyro.PageController should have a render() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.render, "function");
});

test("When rendering a partial-view with no argument, an error is thrown", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.render();
	}, "raised");

});

module("render() - partial-view is already active");

test("It should not attempt to teardown non attached active partial-views", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();	
	var loggedOutTeardown = stubFn();
	pc.partialViews["loggedOut"].view = {teardown: loggedOutTeardown}
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	
	pc.render("setup");
	
	ok(!loggedOutTeardown.called)
});

test("It should not attempt to re-render the parents.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var pvRender1 = stubFn();
	var pvRender2 = stubFn();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["loggedIn"].view = {render: pvRender1};
	pc.partialViews["setup"].active = true;
	pc.partialViews["setup"].view = {render: pvRender2};
	
	// exercise
	pc.render("setup");
	
	// verify
	ok(!pvRender1.called);
	ok(!pvRender2.called);
});

test("It should teardown the active-children partial-views.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var pvTeardown = stubFn();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	pc.partialViews["campaigns"].view = {teardown: pvTeardown};
	
	// exercise
	pc.render("setup");
	
	// verify
	ok(pvTeardown.called);
});

module("render() - partial-view is in-active");

test("Its parent partial-views should be rendered.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	
	var order = [];
	
	pc.partialViews["loggedIn"].view = {
		render: stubFn(null, order)
	}

	pc.partialViews["setup"].view = {
		render: stubFn(null, order)
	}

	pc.render("setup");
	
	
	equals(order[0], pc.partialViews["loggedIn"].view.render);
	equals(order[1], pc.partialViews["setup"].view.render);
	
	ok(pc.partialViews["loggedIn"].view.render.called);
	ok(pc.partialViews["setup"].view.render.called);

});

test("It should teardown non attached partial views.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var order = [];
	var loginView = { teardown: stubFn(null, order) };
	var loggedOutPartialView = { teardown: stubFn(null, order) };
	pc.partialViews["loggedOut"].view = loggedOutPartialView;
	pc.partialViews["loggedOut"].active = true;
	pc.partialViews["loggedOut"].childViews = [loginView];
	
	// exercise
	pc.render("setup");
	
	// verify
	equals(order[0], loginView.teardown);
	equals(order[1], loggedOutPartialView.teardown);
	ok(loginView.teardown.called);
	ok(loggedOutPartialView.teardown.called);

});

test("It should teardown non attached partial views (in order).", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();	
	var order = [];	
	var dashboardHomeView = { teardown: stubFn(null, order) };
	var loggedInPartialView = { teardown: stubFn(null, order) };
	var dashboardPartialView = { teardown: stubFn(null, order) };
	pc.partialViews["loggedIn"].view = loggedInPartialView;
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["dashboard"].view = dashboardPartialView;
	pc.partialViews["dashboard"].active = true;
	pc.partialViews["dashboard"].childViews = [dashboardHomeView];
	
	// exercise
	pc.render("loggedOut");

	// verify
	equals(order[0], dashboardHomeView.teardown);
	equals(order[1], dashboardPartialView.teardown);
	equals(order[2], loggedInPartialView.teardown);
	ok(dashboardHomeView.teardown.called);
	ok(dashboardPartialView.teardown.called);
	ok(loggedInPartialView.teardown.called);
});

test("When trying to render a partial-view into a parent-partial-view that has a child-view in the same container, it should teardown it's child-view first.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var order = [];
	var setupHomeView = { teardown: stubFn(null, order), container: "adam" }
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["setup"].childViews = [setupHomeView];
	pc.partialViews["campaigns"].view.container = "adam";
	var campaignsRender = stubFn(null, order);
	pc.partialViews["campaigns"].view.render = campaignsRender;
	
	// exercise
	pc.render("campaigns");
	
	equals(order[0], setupHomeView.teardown);
	equals(order[1], campaignsRender);
	ok(setupHomeView.teardown.called);
	equals(pc.partialViews["setup"].childViews.length, 0);

});

test("When rendering a partial-view that is on the same level as one that is currently showing, it should be torn down", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	var order = [];
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	
	var setupTeardown = stubFn(null, order);
	var dashboardRender = stubFn(null, order);
	pc.partialViews["setup"].view = {
		container: "#main",
		teardown: setupTeardown
	}
	pc.partialViews["dashboard"].view = {
		container: "#main",
		render: dashboardRender
	}

	pc.render("dashboard");
	
	equals(order[0], setupTeardown);
	equals(order[1], dashboardRender);
	ok(setupTeardown.called);
	
});

test("etc", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = fixtures.getCopyOfMain();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["dashboard"].active = true;	
	var order = [];
	var teardownDashboard = stubFn(null, order);
	var renderDashboard = stubFn(null, order);
	var renderSetup = stubFn(null, order);
	var renderCampaigns = stubFn(null, order);
	pc.partialViews["setup"].view = {	render: renderSetup	};
	pc.partialViews["campaigns"].view = {	render: renderCampaigns	};
	pc.partialViews["dashboard"].view = {	teardown: teardownDashboard, render: renderDashboard };
	pc.render("campaigns");
	
	equals(order[0], teardownDashboard);
	equals(order[1], renderSetup);
	equals(order[2], renderCampaigns)
	ok(!renderDashboard.called);
	ok(teardownDashboard.called);	
});

module("render() - moving from 3 levels deep to a non-attached ")

test("When rendering a non-attached partial-view from 3 levels deep, the correct partial-views should be torn down in order", function() {
  var pc = new Tyro.PageController();
  pc.partialViews = fixtures.getCopyOfMain();
  pc.partialViews["loggedIn"].active = true;
  pc.partialViews["setup"].active = true;
  pc.partialViews["campaigns"].active = true;
  var order = [];
  var teardownLoggedIn = stubFn(null, order);
  var teardownSetup = stubFn(null, order);
  var teardownCampaigns = stubFn(null, order);
  pc.partialViews["loggedIn"].view = { teardown: teardownLoggedIn };
  pc.partialViews["setup"].view = { teardown: teardownSetup };
  pc.partialViews["campaigns"].view = { teardown: teardownCampaigns };
  
  pc.render("loggedOut");
  
  equals(order[0], teardownCampaigns);
  equals(order[1], teardownSetup);
  equals(order[2], teardownLoggedIn);
  
});

