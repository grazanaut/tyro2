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


test("TODO: Tyro.View.activate should call teardown on views which will not be used (in the right order)", function(){
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

test("When trying to render a view into a parent that has a child in the same container, it should teardown that child.", function() {
	/* GIVEN */
	//dashboard and setup have the same container
	var views = fixtures.getCopyOfMain();
    views.campaigns.activate(); //will render setup
    sinon.spy(views.setup, "teardown");

    /* WHEN */

    views.dashboard.activate();

    /* THEN */

    ok(views.setup.teardown.calledOnce);

});


test("When rendering a layout-view that is on the same level as one that is currently showing, it should be torn down", function() {
	/* GIVEN */
	//dashboard and setup have the same container
	var vm = new Tyro.ViewManager(),
	    views = fixtures.getCopyOfMain();
	vm.addTopLevelView(views.loggedIn);
	vm.addTopLevelView(views.loggedOut);
    views.loggedOut.activate();
    sinon.spy(views.loggedOut, "teardown");

    /* WHEN */

    views.loggedIn.activate();

    /* THEN */

    ok(views.loggedOut.teardown.called);

});

test("TODO: test that childActivating() is actually called at the right time(s)/place(s)", function() {ok(false);});

//TODO: move any irrelevant tests to the bottom - they may be required to be added to backoffice instead


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
