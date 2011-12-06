/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

/**
 * NOTE: this is a double-linked-tree structure. As a result, be *very* careful of any deep-copy/extend/compare
 *       routines as they *will* result in stack overflow
 * @constructor
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
    parent.childPartials.push(this);
  }
  this.childViews = [];
  this.childPartials = [];
  this.view = view;
};

Tyro.PartialViewCollectionItem.prototype.getHead = function() {
  var v = this;
  while (!!v.parent) {
    v = v.parent;
  }
  return v;
};

/**
 * @returns {Array} a list of children and children of children, etc which are active. Ordered by lowest-level children first (these always come before their parent)
 */
Tyro.PartialViewCollectionItem.prototype.getActiveDescendantPartials = function() {
  var arr = [],
      childArr = [];

  for (var i = 0; i < this.childPartials.length; i++ ) {
    if (this.childPartials[i].active) {
      arr.unshift(this.childPartials[i]);
      childArr = this.childPartials[i].getActiveDescendantPartials();
      if (childArr.length > 0) {
        arr = childArr.concat(arr);
      }
    }
  }
  return arr;
};

/**
 * A special controller to handle the rendering and tearing down of partial-views
 * @class
 * @constructor
 * @memberOf Tyro
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
	this.partialViews = {};	
};

/**
 * Gets an array of non attached active partial-views that the provided partial view is not attached to
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} A list of non attached active partial-views (in teardown order)
 */
Tyro.PageController.prototype.getPartialViewsNonAttachedActive = function(partialViewId) {
  var results,
      topLevelOfGivenView;

  if (!this.partialViews[partialViewId]) {
    return []; //no view defined, return empty array
  }

  topLevelOfGivenView = this.partialViews[partialViewId].getHead();

  results = this.filter(this.partialViews, function(item) {
    return item !== topLevelOfGivenView && item.parent === null && item.active === true;
  });

  if(results.length) {
    results = results.concat(this.getPartialViewsChildrenActive(results[results.length-1].id).reverse());
  }
  return results.reverse();
};

/**
 * Gets an array of child partial-views that are active for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.getPartialViewsChildrenActive = function(partialViewId) {
  return this.partialViews[partialViewId].getActiveDescendantPartials();
};

/**
 * Gets an array of parent partial-views that are in-active (to be rendered) for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.getPartialViewsInActiveParents = function(partialViewId) {
		var returnVal = [];
		while(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false ) {
				returnVal.push(this.partialViews[partialViewId]);
				partialViewId = this.partialViews[partialViewId].parentId;
		}
		return returnVal.reverse();
};

/**
 * Tears down a partial-view for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.teardownPartialView = function(partialViewId) {
		var pv = this.partialViews[partialViewId];
		if(!pv) return;
		var childViews = pv.childViews;
		for(var i = 0; i < childViews.length; i++) {
				childViews[i].teardown();
				childViews.splice(i, 1);
				i--;
		}
		pv.view.teardown();
		pv.active = false;
};

/**
 * Tears down multiple partial-views given an array of partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.teardownPartialViews = function(arr) {
		for(var i = 0; i < arr.length; i++) {
				this.teardownPartialView(arr[i].id);
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
		var parent = this.partialViews[parentId];
		var existingView = null;
		if(parent) {
				this.teardownChildView(parentId, view.container);
				parent.childViews.push(view);
		}
};

/**
 * Teardown a child-view for a particular partial-view
 * @public
 * @function
 * @example
 * var pc = new Tyro.PageController()
 * // will teardown any child-views that dashboard contains that has a container of "#mainDomNode"
 * pc.teardownChildView("dashboard", "#mainDomNode");
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @param {String} container The selector for the dom node
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.teardownChildView = function(partialViewId, container) {
		var pv = this.partialViews[partialViewId];
		if(pv) {
				for(var i = 0; i < pv.childViews.length; i++) {
						if(pv.childViews[i].container === container) {
								pv.childViews[i].teardown();
								pv.childViews.splice(i, 1);
								break;
						}
				}
		}
};

/**
 * Adds a new partial-view for the page-controller to manage.
 * Must conform to particular interface to be accepted.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Tyro.PartialViewCollectionItem} pv The partial-view object
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.addPartialView = function(pv) {

  if(!(pv instanceof Tyro.PartialViewCollectionItem)) {
      throw new TypeError("Tyro: PageController: addPartialView: provide a partial view collection item");
  }
  
  this.partialViews[pv.id] = pv;
};

/**
 * Checks to see if a particular partial-view is active or not
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Boolean} Returns true when active, otherwise false
 */
Tyro.PageController.prototype.isPartialViewActive = function(partialViewId) {
		return this.partialViews[partialViewId].active;
};

/**
 * Renders a collection of partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.renderPartialViews = function(partialViews) {
		for(var i = 0; i < partialViews.length; i++) {
				partialViews[i].view.render();
				partialViews[i].active = true;
		}
};

/**
 * The function which is responsible for the tearing down and rendering of partial-views.
 * It works out what is currently rendered, what needs to be rendered and what needs to be
 * torn down and in what order all that happens.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.render = function(partialViewId) {
		if(!partialViewId) {
				throw new TypeError("Tyro: PageController: render: Must provide a partialViewId");
		}

		if(this.isPartialViewActive(partialViewId)) {
				this.teardownPartialViews(this.getPartialViewsChildrenActive(partialViewId));
		}
		else {
				this.teardownPartialViews(this.getPartialViewsNonAttachedActive(partialViewId));

				this.teardownPartialViews(this.getPartialViewsChildrenActive(partialViewId));

				var inactiveParents = this.getPartialViewsInActiveParents(partialViewId);
				if(inactiveParents.length) {
						var childrenToTeardown = this.getPartialViewsChildrenActive(inactiveParents[0].parentId);
						this.teardownPartialViews(childrenToTeardown);
				}

				var parent = this.partialViews[this.partialViews[partialViewId].parentId];

				if(parent) {
						this.teardownChildView(parent.id, this.partialViews[partialViewId].view.container);
				}

				this.teardownPartialView(this.getPartialViewIdActiveWithDomContainer(this.partialViews[partialViewId].view.container))

				this.renderPartialViews(this.getPartialViewsInActiveParents(partialViewId));
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
Tyro.PageController.prototype.getPartialViewIdActiveWithDomContainer = function(container) {
  var results = this.filter(this.partialViews, { active: true, container: container });
  return results.length > 0 ? results[0].id : null;
};

Tyro.PageController.prototype.matches = function(item, queryOrFunction) {
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
};

Tyro.PageController.prototype.filter = function(collection, queryOrFunction) {
  var i, item,
      results = [];
  for (i in collection) {
    item = collection[i];
    if (this.matches(item,queryOrFunction)) {
      results.push(item);
    }
  }
  return results;
};
