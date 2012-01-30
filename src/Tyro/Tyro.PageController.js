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
 *    pc.render("dashboard");
 *    pc.addChildView("dashboard", dashboardHomeView);
 *    dashboardHomeView.showLoader();
 *    dashboardHomeView.hideLoader();
 *    dashboardHomeView.render();
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
