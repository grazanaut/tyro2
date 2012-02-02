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
  f.loggedOut = new Tyro.View(null, { renderOnActivate: true });
  f.loggedOut.container = "some container for logged out";
  f.loggedIn = new Tyro.View(null, { renderOnActivate: true });
  f.loggedIn.container = "some container for logged in";
  f.dashboard = new Tyro.View(f.loggedIn, { renderOnActivate: true });
  f.dashboard.container = "#main";
  f.setup = new Tyro.View(f.loggedIn, { renderOnActivate: true });
  f.setup.container = "#main";
  f.campaigns = new Tyro.View(f.setup);
  f.campaigns.container = "some container";
  for (var p in f) {
  	if (f.hasOwnProperty(p)) {
  	  f[p]._____testFixtureName = p; //assist with inspecting whilst testing  		
  	}
  }
  return f;
};
fixtures.main = fixtures.getCopyOfMain(); //backward-compatibility

module("Tyro.TreeNode# new Tyro.TreeNode()");

test("When instantiating, parent should be set, and children registered.", function() {
  var parent, child, child2;
  parent = new Tyro.TreeNode(null);
  child = new Tyro.TreeNode(parent);
  child2 = new Tyro.TreeNode(parent);
  //use ok() and  === rather than equal or strictEqual
  //equal will infinitely recurse in the test
  //strictEqual will infinitely recurse in its results, even if it passes
  ok(child.parent === parent, "Child's parent should be the passed in parent");
  ok(parent.children[0] === child, "Parent's first child should be the child we provided");
  ok(child2.parent === parent, "Child2's parent should be the passed in parent");
  ok(parent.children[1] === child2, "Parent's second child should be the child2 we provided");
});

test("When instantiating without an incorrectly typed parent argument, an error is thrown.", function() {
  raises(function() {
    var node = new Tyro.TreeNode([]); //pass an array in instead...
  }, "raised");
});

module("new Tyro.AbstractView()");

module("Tyro.AbstractView#teardownActiveDescendantLayouts");


//TODO: add the following test...
/*test("This should tear down all the active children layout views", function() {
  var head, branch1, branch2, leaf1a, leaf1b, leaf2a,
      tornDown = [];
  function newView(parent, id) {
    var v = new Tyro.AbstractView(parent, id);
    v.doTeardown = function(){
      tornDown.push(this);
    };
    return v;
  }
  head = newView(null,"h");
  branch1 = newView(head, "1");
  branch2 = newView(head, "2");
  leaf1a = newView(branch1); //not providing an id makes it a normal view and not a layout
  leaf1b = newView(branch1, "1b");
  leaf2a = newView(branch2, "2a");

  head.active = true;
  branch1.active = true;
  leaf1b.active = true;

  branch1.teardownActiveDescendantLayouts();

  equal(tornDown.length, 3);
  //should be torn in reverse order
  //use ok() and not equal, strictEqual to prevet recursion
  ok(tornDown[0] === leaf1b);
  ok(tornDown[1] === leaf1a);
  ok(tornDown[2] === branch1);
  //should also have removed leaf1a as it's not a layout
  equal(branch1.children.length, 1);

});*/

//TODO: move tests not relevant to View (i.e. Abstract View or TreeNode) into the relevant files

module("Tyro.new Tyro.PartialViewCollectionItem()");

module("Tyro.PartialViewCollectionItem#getActiveDescendantPartials()");

module("Tyro.View#activate()");

test("Tyro.View.activate should call activate on inactive parents", function() {
	var views = fixtures.getCopyOfMain();
    sinon.spy(views.loggedOut, "activate");
    sinon.spy(views.loggedIn, "activate");
    sinon.spy(views.dashboard, "activate");
    sinon.spy(views.setup, "activate");
    sinon.spy(views.campaigns, "activate");

    views.campaigns.activate();

    ok(views.setup.activate.calledOnce);
    ok(views.loggedIn.activate.calledOnce);
    ok(!views.dashboard.activate.called);
    ok(!views.loggedOut.activate.called);

});

test("Tyro.View.activate should cause all parent 'renderOnActivate' views to be 'active'", function() {
	var views = fixtures.getCopyOfMain();

    views.campaigns.activate();

    ok(views.setup.isActive());
    ok(views.loggedIn.isActive());
    ok(!views.dashboard.isActive());
    ok(!views.loggedOut.isActive());

});

test("Tyro.View.activate should cause all parent 'renderOnActivate' views to be rendered in the right order", function() {
	var views = fixtures.getCopyOfMain();
    sinon.spy(views.loggedIn, "render");
    sinon.spy(views.setup, "render");

    views.campaigns.activate();

    ok(views.loggedIn.render.calledOnce);
    ok(views.setup.render.calledOnce);
    ok(views.loggedIn.render.calledBefore(views.setup.render));   
});

test("TODO: Tyro.View.activate should not reactivate/render active parent views", function(){
	ok(false); //test not yet implemented
});


test("TODO: Tyro.View.activate should call teardown on views which will not be used", function(){
	ok(false); //test not yet implemented
});

module("Tyro.View#teardown()");

test("When tearing down an inactive view it should not call teardown on its descendants", function() {
	var views = fixtures.getCopyOfMain();
    sinon.spy(views.loggedOut, "teardown");
    sinon.spy(views.loggedIn, "teardown");
    sinon.spy(views.dashboard, "teardown");
    sinon.spy(views.setup, "teardown");
    sinon.spy(views.campaigns, "teardown");

    views.loggedIn.teardown();

    ok(!views.setup.teardown.called);
    ok(!views.campaigns.teardown.called);
    ok(!views.dashboard.teardown.called);
    ok(!views.loggedOut.teardown.called);
});

test("When tearing down an view it should call teardown on it's descendants", function() {
	var views = fixtures.getCopyOfMain();
    sinon.spy(views.loggedOut, "teardown");
    sinon.spy(views.loggedIn, "teardown");
    sinon.spy(views.dashboard, "teardown");
    sinon.spy(views.setup, "teardown");
    sinon.spy(views.campaigns, "teardown");

    views.campaigns.activate();
    views.loggedIn.teardown();

    ok(views.setup.teardown.called);
    ok(views.campaigns.teardown.called);
    ok(!views.dashboard.teardown.called);
    ok(!views.loggedOut.teardown.called);
});

test("When tearing down an view it should internally teardown descendants in the right order", function() {
	var views = fixtures.getCopyOfMain(),
	    originalRemove = views.loggedIn.removeFromDom,
	    a = [];
	function spyAndRecord() {
	  a.push(this);
      originalRemove.apply(this, arguments);
	}
    sinon.stub(views.setup, "removeFromDom", spyAndRecord);
    sinon.stub(views.campaigns, "removeFromDom", spyAndRecord);
    views.campaigns._renderOnActivate = true; //cause render to be called so it becomes active (and hence teardown will be called)

    views.campaigns.activate();
    views.loggedIn.teardown();

    ok(a[0] === views.campaigns);
    ok(a[1] === views.setup);
});

module("Tyro.View#addChild()");


test("When adding a view with incorrect arguments an error is thrown.", function() {
	var view = new Tyro.View(null);
	raises(function() {
		view.addChild({});
	}, "raised");
});

test("When adding a valid view it should be added to it's parents children.", function() {
	var parent = new Tyro.View(null),
	    child = new Tyro.View(parent);

	ok(child.parent === parent);
	ok(parent.children[0] === child);

	parent = new Tyro.View(null);
	child = new Tyro.View(null);

	parent.addChild(child);
	
	ok(child.parent === parent);
	ok(parent.children[0] === child);	
});

module("Tyro.ViewManager");

test("should teardown unrelated active views when a view is rendered", function() {
	var vm = new Tyro.ViewManager(),
	    views = fixtures.getCopyOfMain();

    sinon.spy(views.loggedIn, "teardown");
    sinon.spy(views.loggedOut, "teardown");

	vm.addTopLevelView(views.loggedIn);
	vm.addTopLevelView(views.loggedOut);

    views.loggedIn.activate(); //part of the test SETUP - activate another view, before testing teardown by activating testing view

    //the actual test
	views.loggedOut.activate();

	ok(views.loggedIn.teardown.called);
	ok(!views.loggedOut.teardown.called); //also check we don't teardown view we're rendering
});

test("TODO: should teardown unrelated views only once when a view is rendered", function() {
	var vm = new Tyro.ViewManager(),
	    views = fixtures.getCopyOfMain();

    sinon.spy(views.loggedIn, "teardown");
    sinon.spy(views.loggedOut, "teardown");

	vm.addTopLevelView(views.loggedIn);
	vm.addTopLevelView(views.loggedOut);

	views.loggedOut.activate();

	ok(views.loggedIn.teardown.calledOnce);
	ok(!views.loggedOut.teardown.called);
});


module("Tyro.View#render()");

test("It should not attempt to teardown non attached active partial-views (TODO: not sure what this means - was an old test from when pageController existed and has been ported to new views)", function() {
	var vm = new Tyro.ViewManager(),
	    views = fixtures.getCopyOfMain();
	
	vm.addTopLevelView(views.loggedIn);
	vm.addTopLevelView(views.loggedOut);
	views.setup.activate();

	sinon.spy(views.loggedOut, "teardown");

    
    views.setup.render();
	
	ok(!views.loggedOut.teardown.called)
});

test("It should not attempt to re-render already active parents", function() {
	// setup
	var vm = new Tyro.ViewManager(),
	    views = fixtures.getCopyOfMain();
	
	views.setup.activate();
	sinon.spy(views.loggedOut, "render"); //*after* initial activation
	sinon.spy(views.setup, "render"); //*after* initial activation
		
	// exercise
	views.campaigns.render();
	
	// verify
	ok(!views.loggedOut.called);
	ok(!views.setup.called);
});

test("TODO: test that childActivating() is actually called at the right time(s)/place(s)", function() {ok(false);});

//TODO: move any irrelevant tests to the bottom - they may be required to be added to backoffice instead

module("Tyro.PageController#render() - partial-view is already active");



test("It should teardown the active-children partial-views.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.items = fixtures.getCopyOfMain();
	var pvTeardown = stubFn();
	pc.items["loggedIn"].active = true;
	pc.items["setup"].active = true;
	pc.items["campaigns"].active = true;
	pc.items["campaigns"].view = {teardown: pvTeardown};
	
	// exercise
	pc.render("setup");
	
	// verify
	ok(pvTeardown.called);
});

module("Tyro.PageController#render() - partial-view is in-active");

test("Its parent partial-views should be rendered.", function() {
	var pc = new Tyro.PageController();
	pc.items = fixtures.getCopyOfMain();
	
	var order = [];
	
	pc.items["loggedIn"].view.render = stubFn(null, order);
	pc.items["setup"].view.render = stubFn(null, order);

	pc.render("setup");
	
	
	equals(order[0], pc.items["loggedIn"].view.render);
	equals(order[1], pc.items["setup"].view.render);
	
	ok(pc.items["loggedIn"].view.render.called);
	ok(pc.items["setup"].view.render.called);

});

test("It should teardown non attached partial views.", function() {
	var pc = new Tyro.PageController();
	pc.items = fixtures.getCopyOfMain();
	var order = [];
	var loginView = { teardown: stubFn(null, order) };
	var loggedOutPartialView = { teardown: stubFn(null, order) };
	pc.items["loggedOut"].view = loggedOutPartialView;
	pc.items["loggedOut"].active = true;
	pc.items["loggedOut"].childViews = [loginView];
	
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
	pc.items = fixtures.getCopyOfMain();	
	var order = [];	
	var dashboardHomeView = { teardown: stubFn(null, order) };
	var loggedInPartialView = { teardown: stubFn(null, order) };
	var dashboardPartialView = { teardown: stubFn(null, order) };
	pc.items["loggedIn"].view = loggedInPartialView;
	pc.items["loggedIn"].active = true;
	pc.items["dashboard"].view = dashboardPartialView;
	pc.items["dashboard"].active = true;
	pc.items["dashboard"].childViews = [dashboardHomeView];
	
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
	pc.items = fixtures.getCopyOfMain();
	var order = [];
	var setupHomeView = { teardown: stubFn(null, order), container: "adam" }
	pc.items["loggedIn"].active = true;
	pc.items["setup"].active = true;
	pc.items["setup"].childViews = [setupHomeView];
	pc.items["campaigns"].view.container = "adam";
	var campaignsRender = stubFn(null, order);
	pc.items["campaigns"].view.render = campaignsRender;
	
	// exercise
	pc.render("campaigns");
	
	equals(order[0], setupHomeView.teardown);
	equals(order[1], campaignsRender);
	ok(setupHomeView.teardown.called);
	equals(pc.items["setup"].childViews.length, 0);

});

test("When rendering a partial-view that is on the same level as one that is currently showing, it should be torn down", function() {
	var pc = new Tyro.PageController();
	pc.items = fixtures.getCopyOfMain();
	var order = [];
	pc.items["loggedIn"].active = true;
	pc.items["setup"].active = true;
	
	var setupTeardown = stubFn(null, order);
	var dashboardRender = stubFn(null, order);
	pc.items["setup"].view = {
		container: "#main",
		teardown: setupTeardown
	}
	pc.items["dashboard"].view = {
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
	pc.items = fixtures.getCopyOfMain();
	pc.items["loggedIn"].active = true;
	pc.items["dashboard"].active = true;	
	var order = [];
	var teardownDashboard = stubFn(null, order);
	var renderDashboard = stubFn(null, order);
	var renderSetup = stubFn(null, order);
	var renderCampaigns = stubFn(null, order);
	pc.items["setup"].view = {	render: renderSetup	};
	pc.items["campaigns"].view = {	render: renderCampaigns	};
	pc.items["dashboard"].view = {	teardown: teardownDashboard, render: renderDashboard };
	pc.render("campaigns");
	
	equals(order[0], teardownDashboard);
	equals(order[1], renderSetup);
	equals(order[2], renderCampaigns)
	ok(!renderDashboard.called);
	ok(teardownDashboard.called);	
});

module("Tyro.PageController#render() - moving from 3 levels deep to a non-attached ")

test("When rendering a non-attached partial-view from 3 levels deep, the correct partial-views should be torn down in order", function() {
  var pc = new Tyro.PageController();
  pc.items = fixtures.getCopyOfMain();
  pc.items["loggedIn"].active = true;
  pc.items["setup"].active = true;
  pc.items["campaigns"].active = true;
  var order = [];
  var teardownLoggedIn = stubFn(null, order);
  var teardownSetup = stubFn(null, order);
  var teardownCampaigns = stubFn(null, order);
  pc.items["loggedIn"].view = { teardown: teardownLoggedIn };
  pc.items["setup"].view = { teardown: teardownSetup };
  pc.items["campaigns"].view = { teardown: teardownCampaigns };
  
  pc.render("loggedOut");
  
  equals(order[0], teardownCampaigns);
  equals(order[1], teardownSetup);
  equals(order[2], teardownLoggedIn);
  
});

module("TESTS THAT NEED TO BE MOVED INTO BackOffice and out of Tyro");

test("Tyro.PageController#addChildView() When adding a view that has the same container as a view already in the partial-views childViews array, teardown and remove it first.",  function() {
	var pc = new Tyro.PageController();
	pc.items = fixtures.getCopyOfMain();
	var view1 = { teardown: stubFn(), container: "container1" };
	var view2 = { teardown: stubFn(), container: "container2" };
	var view3 = { teardown: stubFn(), container: "container1" };
	pc.items["setup"].childViews = [view1, view2];

	pc.addChildView("setup", view3);

	ok(view1.teardown.called);
	ok(!view2.teardown.called);
	
	equals(pc.items["setup"].childViews.length, 2);
	
})
