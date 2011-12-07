/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

(function() {


//utility methods private to this module
var Utils = {
  matches: function(item, queryOrFunction) {
    if ($.isFunction(queryOrFunction)) {
      return queryOrFunction(item);
    }
    var itemprop, prop;
    for (prop in queryOrFunction) {
      itemprop = $.isFunction(item[prop]) ? item[prop]() : item[prop];
      if (itemprop !== queryOrFunction[prop]) {
        return false;
      }
    }
    return true;
  },
  filter: function(collection, queryOrFunction) {
    var i, item,
        results = [];
    for (i in collection) {
      item = collection[i];
      if (Utils.matches(item,queryOrFunction)) {
        results.push(item);
      }
    }
    return results;
  }
};


/**
 * A wrapper/encapsulator/adapter for partial views (layouts) which is used as a double-linked-list/tree-node to
 * represent layouts with one or more child layouts or child views
 * In Tyro.PageController, an "Item" represents one of the nodes in this tree representation which wraps a partial view.
 * A PartialViewCollectionItem contains a View object which is the actual PartialView
 * with render methods, etc.
 * References to these items are also stored in a flat (non-tree) hashmap as Tyro.PageController.items
 * NOTE: this is a double-linked-tree structure. As a result, be *very* careful of any deep-copy/extend/compare
 *       routines as they *will* result in stack overflow
 * @class
 * @constructor
 * @memberOf Tyro
 * @param {string} id The id of this pv item
 * @param {Tyro.PartialViewCollectionItem} parent The parent item (or null)
 * @param {Object} view The view associated with this item
 */
Tyro.PartialViewCollectionItem = function(id, parent, view) {
  if(typeof id !== "string") {
    throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide an id");
  }
  if(parent !== null && !(parent instanceof Tyro.PartialViewCollectionItem)) {
    throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide a parent of null or type PartialViewCollectionItem");
  }
  if(!$.type(view) === "object") {
      throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide a view object");
  }
  if(typeof view.render !== "function") {
      throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide a view with a render method");
  }
  if(typeof view.teardown !== "function") {
      throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide a view with a teardown method");
  }
  if(typeof view.container !== "string") {
      throw new TypeError("Tyro: PartialViewCollectionItem: constructor: Must provide a view with a container property");
  }
  
  this.id = id;
  this.active = false;
  this.parent = parent;
  this.parentId = null;
  if (parent) {
    this.parentId = parent.id;
    parent.childCollectionItems.push(this);
  }
  this.childViews = [];
  this.childCollectionItems = [];
  this.view = view;
};

/**
 * Gets the view's container
 * @public
 * @function
 * @memberOf Tyro.PartialViewCollectionItem
 * @returns {string} The view's container
 */
Tyro.PartialViewCollectionItem.prototype.getViewContainer = function() {
  return this.view.container;
};


/**
 * Gets the top level (head) of the partial view by traversing up the chain of parents
 * @public
 * @function
 * @memberOf Tyro.PartialViewCollectionItem
 * @returns {Tyro.PartialViewCollectionItem} The head/top item
 */
Tyro.PartialViewCollectionItem.prototype.getHead = function() {
  var v = this;
  while (!!v.parent) {
    v = v.parent;
  }
  return v;
};

/**
 * Gets an array of child partial-views that are active for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PartialViewCollectionItem
 * @returns {Array} an array of partial-view children and children of children, etc which are active. Ordered by lowest-level children first (these always come before their parent)
 */
Tyro.PartialViewCollectionItem.prototype.getActiveDescendantPartials = function() {
  var arr = [],
      childArr = [];

  for (var i = 0; i < this.childCollectionItems.length; i++ ) {
    if (this.childCollectionItems[i].active) {
      arr.unshift(this.childCollectionItems[i]);
      childArr = this.childCollectionItems[i].getActiveDescendantPartials();
      if (childArr.length > 0) {
        arr = childArr.concat(arr);
      }
    }
  }
  return arr;
};

/**
 * Gets inactive (unrendered) parents and parents of parents (including "this"if inactive)
 * @public
 * @function
 * @memberOf Tyro.PartialViewCollectionItem
 * @returns {Array} An array of Tyro.PartialViewCollectionItem ordered parents first then children (and "this" last)
 */
Tyro.PartialViewCollectionItem.prototype.getInactiveParents = function() {
  var pv = this,
      result = [];
  //check if active - if this or any parents are active we assume that all remaining parents are also active, and we stop
  while (pv && !pv.active) {
    result.unshift(pv);
    pv = pv.parent;
  }
  return result;
};

/**
 * Tears down the contained view and all childViews
 * @public
 * @function
 * @memberOf Tyro.PartialViewCollectionItem
 */
Tyro.PartialViewCollectionItem.prototype.teardownViews = function() {
		var childViews = this.childViews;
		for(var i = 0; i < childViews.length; i++) {
				childViews[i].teardown();
				childViews.splice(i, 1);
				i--;
		}
		this.view.teardown();
		this.active = false;
};

/**
 * Teardown a child-view with a given container
 * @public
 * @function
 * @example
 * var dashboard = new Tyro.PartialViewCollectionItem("dashboard", null, new fixtures.MockView("#mainDomNode"));
 * // will teardown any child-views that dashboard contains that has a container of "#mainDomNode"
 * dashboard.teardownChildView("#mainDomNode");
 * @memberOf Tyro.PartialViewCollectionItem
 * @param {String} container The selector for the dom node
 */
Tyro.PartialViewCollectionItem.prototype.teardownChildView = function(container) {
  for(var i = 0; i < this.childViews.length; i++) {
    if(this.childViews[i].container === container) {
      this.childViews[i].teardown();
      this.childViews.splice(i, 1);
      break;
    }
  }
};


/**
 * A special controller to handle the rendering and tearing down of partial-views
 * @class
 * @constructor
 * @memberOf Tyro
 * @property {Tyro.PartialViewCollectionItem[]} items The hashmap (not actually an array, but specified for jsDoc purposes)
 *           of PartialViewCollectionItems the PageController manages. Each item contains a partialView and one or more
 *           child items or child views
 * @example
 * var pc = new Tyro.PageController();
 * function controllerAction() {
 * 		pc.render("dashboard");
 * 		pc.addChildView("dashboard", dashboardHomeView);
 * 		dashboardHomeView.showLoader();
 * 		dashboardHomeView.hideLoader();
 * 		dashboardHomeView.render();
 * }
 */
Tyro.PageController = function() {
	this.items = {};
};

/**
 * Gets an array of top-level partial-views (i.e. those without parents)
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @returns {Array} A list of active top-level views
 */
Tyro.PageController.prototype.getActiveTopLevelItems = function() {
  return Utils.filter(this.items, { parent: null, active: true });
};

/**
 * Gets an array of all active partial-views that are unrelated to the provided partial view
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Tyro.PartialViewCollectionItem} item The id of the partial-view i.e. "dashboard"
 * @returns {Array} A list of unrelated active partial-views (in teardown order)
 */
Tyro.PageController.prototype.getActiveItemsUnrelatedTo = function(item) {
  if (!item) {
    return []; //no view defined, return empty array
  }

  var unrelatedTopLevelActiveViews, i, view,
      returnVal = [],
      topLevelOfGivenView = !!item ? item.getHead() : null,
      activeTopLevelViews = this.getActiveTopLevelItems();

  unrelatedTopLevelActiveViews = Utils.filter(activeTopLevelViews, function(item) {
    return item !== topLevelOfGivenView;
  });

  for (i = 0; i < unrelatedTopLevelActiveViews.length; i++) { //in theory we should only have one active top-level view, but just in case...
    view = unrelatedTopLevelActiveViews[i];
    //we do this in reverse, but rather than using reverse twice, just concat children first and then push top level
    returnVal = view.getActiveDescendantPartials().concat(view, returnVal);
  }
  return returnVal;
};

/**
 * Tears down multiple partial-views given an array of PartialViewCollectionItems
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Tyro.PartialViewCollectionItems[]} items An array of partial views to teardown
 */
Tyro.PageController.prototype.teardownItems = function(items) {
		for(var i = 0; i < items.length; i++) {
				items[i].teardownViews();
		}
};

/**
 * Adds a view to become a stored child view for a particular partial-view. So that
 * the partial-view can keep track of what child views it may or may not need to teardown
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} parentId The id of the partial-view i.e. "dashboard"
 * @param {Object} view The view object
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.addChildView = function(parentId, view) {
    if(!view) {
      throw new TypeError("Tyro: PageController: addChildView: Must provide a view to add.");
    }
    if(typeof view.container !== "string") {
      throw new TypeError("Tyro: PageController: addChildView: Must provide a view container.");
    }
    if(typeof view.teardown !== "function") {
      throw new TypeError("Tyro: PageController: addChildView: Must provide a view teardown function.");
    }
		var parent = this.items[parentId];
		if(parent) {
				parent.teardownChildView(view.container);
				parent.childViews.push(view);
		}
};


/**
 * Adds a new partial-view-collection-item for the page-controller to manage.
 * Must conform to particular interface to be accepted.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Tyro.PartialViewCollectionItem} item
 */
Tyro.PageController.prototype.addItem = function(item) {

  if(!(item instanceof Tyro.PartialViewCollectionItem)) {
      throw new TypeError("Tyro: PageController: addPartialView: provide a partial view collection item");
  }
  
  this.items[item.id] = item;
};

/**
 * Renders a collection of partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Tyro.PartialViewCollectionItem[]} items The partial views array to render
 */
Tyro.PageController.prototype.renderItems = function(items) {
		for(var i = 0; i < items.length; i++) {
				items[i].view.render();
				items[i].active = true;
		}
};

/**
 * The function which is responsible for the tearing down and rendering of partial-views.
 * It works out what is currently rendered, what needs to be rendered and what needs to be
 * torn down and in what order all that happens.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} itemId The id of the PartialViewCollectionItem object i.e. "dashboard"
 */
Tyro.PageController.prototype.render = function(itemId) {
  if(!itemId) {
    throw new TypeError("Tyro: PageController: render: Must provide a partialViewId");
  }

  var item = this.items[itemId],
      parent = item.parent;

  //always attempt to teardown any descendants of the view
  this.teardownItems(item.getActiveDescendantPartials());

  //if view is already active, no need to re-render (we've simply torn down descendants)
  if(!item.active) {
    this.teardownItems(this.getActiveItemsUnrelatedTo(item));

    var inactiveParents = item.getInactiveParents(); //ordered parents->children (including "item" as last element)

    if(inactiveParents.length && inactiveParents[0].parent) {
		  var childrenToTeardown = inactiveParents[0].parent.getActiveDescendantPartials();
      this.teardownItems(childrenToTeardown);
    }

    if(parent) {
      parent.teardownChildView(item.view.container);
    }

    this.teardownItems(this.getPartialViewActiveWithDomContainer(item.view.container));

    //we getInactiveParents() again, is they have been torn down, so may be different to the inactiveParents local var from above
    this.renderItems(item.getInactiveParents()); //ordered parents->children (including "item" as last element)
  }
};

/**
 * Gets the partial-view id with a particular dom container.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} container The DOM selector i.e. "#mainDomNode"
 * @returns {String/Null} Returns the partial-view id if found, otherwise null
 */
Tyro.PageController.prototype.getPartialViewActiveWithDomContainer = function(container) {
  return Utils.filter(this.items, { active: true, getViewContainer: container });
};


}());//end of module closure/wrapper method
