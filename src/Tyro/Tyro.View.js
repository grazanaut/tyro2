/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

(function() {

  function isFunc(fn) {
    return typeof fn === "function";
  }

  /**
   * Simple inheritance behaviour, giving access to "this.inherited()" in methods
   * @param {String} className The name of the new class
   * @param {Function} Base The base class (function because the constructor function should be passed in)
   * @param {Object} classDef Definition of new class. If provided with a "constructor" property, this will be executed when the class is "newed"
   * @example usage var NewClass = klass("NewClass", Base, { constructor: function() {} });
   */
  function klass(className, Base, classDef){

    var p, prop, baseProp, Class,
        _extendingWith = Base._extendingWith,
        basePt = Base.prototype;

    if (typeof classDef.constructor !== "undefined") {
      classDef._constructor = classDef.constructor;
    }
    //we have constructor in new ._constructor property,
    //so we delete .constructor to prevent needless iteration later
    //as we'll set constructor to *actual* constructor later
    delete classDef.constructor;

    //define the new class
    Class = function(){
      this.____className = className;
      //call the constructor IF defined AND we're actually constructing and
      //not merely extending with a sub class
      var thisClass = this.constructor;
      if (!thisClass._extendingWith && isFunc(this._constructor)) {
        this._constructor.apply(this, arguments);
      }
    };
    
    //do the standard prototypal inheritance
    //but we need to tell the base class not to call the _constructor method
    //as it's being extended, not being instantiated
    Base._extendingWith = Class;
    Class.prototype = new Base();
    if (typeof _extendingWith === "undefined") {
      delete Base._extendingWith;
    }
    else {
      Base._extendingWith = _extendingWith;
    }

    //define our closure-creation method for creating inherited() functionality
    function overrideMethod(baseFn, childFn){
      return function() {
        //store inherited in case it already exists
        var _inherited = this.inherited;
        //make inherited() the base method
        this.inherited = baseFn;
        //call childFn now that inherited() exists
        childFn.apply(this, arguments);
        //reset this.inherited
        this.inherited = _inheritred;
      };
    }

    //add the classDef properties to the prototype, catering for overridden methods
    for (p in classDef) {
      prop = classDef[p];
      baseProp = basePt[p];
      if (isFunc(baseProp)) {
        if (!isFunc(prop)) {
          throw new Error("Attempt to override function with non-function");
        }
        prop = overrideMethod(baseProp, prop);
      }
      Class.prototype[p] = prop;
    }

    //do the standard constructor reset, so instanceof, etc works as expected
    Class.prototype.constructor = Class;

    //return the new class
    return Class;
  }

  /**
   * A tree node from which base view will inherit
   * References to these items are also stored in a flat (non-tree) hashmap as Tyro.PageController.items
   * NOTE: this is a double-linked-tree structure. As a result, be *very* careful of any deep-copy/extend/compare
   *       routines as they *will* result in stack overflow
   * @class
   * @abstract
   * @memberOf Tyro
   */
  var TreeNode = Tyro.TreeNode = klass("TreeNode", Object, {
    /**
     * @constructor
     * @param {TreeNode} parent The parent item (or null)
     */
    constructor: function(parent) {
      //defaults
      this.children = [];
      //provided properties
      this.setParent(parent);
    },
    /*
     * Public Properties
     */
    parent: null,
    setParent: function(p) {
      if(p !== null && !(p instanceof TreeNode)) {
        throw new TypeError("Tyro: TreeNode: Parent must be null or type TreeNode");
      }
      if (this.parent === p) return; //prevent needless recursion
      if (!!p) {
        p.addChild(this);
      }
      this.parent = p; //must be after addChild call, to prevent recursion
    },
    removeFromParent: function() {
      if (!!this.parent) {
        //remove from previous parent
        this.parent.removeChild(child);
        this.parent = null;
      }
    },
    /**
     * Gets the top level (head) of the partial view by traversing up the chain of parents
     * @public
     * @function
     * @returns {TreeNode} The head/top item
     */
    getHead: function() {
      if (!this.parent) return this;
      return this.parent.getHead();
    },
    /**
     * Iterates/recurses all children and descendants with given callback(s), which can optionally stop iteration
     * @public
     * @function
     * @param {Function(TreeNode)} [callbacks.before]
     *    Optional callback method for each node found, executed
     *    before iterating children.
     * @param {Function(TreeNode)} [callbacks.after]
     *    Optional callback method for each node found, executed
     *    after iterating children.
     *
     *  If either callback returns exactly false (false, not undefined or falsey),
     *  it will stop iteration on that branch
     */
    traverseDescendants: function(callbacks) {
      var cbs = callbacks || {},
          child;

      for (var i = 0; i < this.children.length; i++ ) {
        child = this.children[i];
        if (isFunc(cbs.before) && cbs.before(child) === false) return false;
        if (this.children[i].traverseDescendants(cbs)) return false;
        if (isFunc(cbs.after) && cbs.after(child) === false) return false;
      }
    },
    /**
     * Traverses all THIS and all parents, stopping if callback returns false
     * @public
     * @function
     * @returns {Function(TreeNode)} [callback] The callback method for each node.
     *                                          If it returns false (false, not undefined),
     *                                          it will stop iteration on that branch
     */
    traverseUpwards: function(callback) {
      if (!isFunc(callback) || callback(this) !== false) { //must explicitly return false and not just undefined, to stop iteration
        if (!!this.parent) {
          this.parent.traverseUpwards(callback);
        }
      }
    },
    /**
     * Adds a node as a child
     * @public
     * @function
     * @param {TreeNode} child The child node to add
     */
    addChild: function(child) {
      if(!(child instanceof TreeNode)) {
        throw new TypeError("Tyro: TreeNode: addChild: Must provide an instance of TreeNode");
      }
      if (child.parent === this) return; //nothing to do
      child.removeFromParent(); //remove from previous parent if exists
      this.children.push(child);
      child.parent = this; //set child's parent directly, rather than calling setParent() -> we don't want infinite recursion happening now, do we ;-)
    },
    /**
     * Adds a node as a child
     * @public
     * @function
     * @param {TreeNode} child The child node to add
     */
    removeChild: function(child) {
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i] === child) {
          return this.removeChildByIndex(i);
        }
      }
    },
    removeChildByIndex: function(index) {
      var child = this.children[index];
      this.children.splice(index,1);
      child.setParent(null);
      return child;
    }
  });

  /**
   * represent layouts with one or more child layouts or child views
   * In Tyro.PageController, an "Item" represents one of the nodes in this tree representation which wraps a partial view.
   * A PartialViewCollectionItem contains a View object which is the actual PartialView
   * with render methods, etc.
   * References to these items are also stored in a flat (non-tree) hashmap as Tyro.PageController.items
   * NOTE: this is a double-linked-tree structure. As a result, be *very* careful of any deep-copy/extend/compare
   *       routines as they *will* result in stack overflow
   * @class
   * @memberOf Tyro
   */
  var AbstractView = Tyro.AbstractView = klass("AbstractView", TreeNode, {
    /** @property container Subclasses should inject/set */
    container: null,

    /**
     * @constructor
     * @override
     * @param {AbstractView} parent The parent view (or null)
     * @param {string} [id] The id of this view, IF it's a layout
     */
    constructor: function(parent, id) {
      this.id = id;
      this.active = false;

      this.inherited(parent);
    },
    isLayout: function() {
      return !!this.id; //considered a layout if it has an id
    },
    /**
     * @abstract
     * Child Classes should override this method to implement teardown behaviours
     */
    //TODO: active probably means non-persistent (i.e. not menu, etc) - change name of this
    isActive: function(){
      return this.active;
    },

    
    removeChildInContainer: function(container) {
      for (var i = 0; i < this.children.length; i++) {
//////IS THIS NEEDED?!?
      }
    },
    /**
     * @abstract
     * Child Classes should override this method to implement teardown behaviours
     */
    doTeardown: function(){},

    /**
     * @public
     * @function
     * Calls teardown on all children, and then self
     */
    teardown: function() {
      //children first
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].teardown();
      }
      this.active = false; //todo: should this be before or after doTeardown?
      //then self
      this.doTeardown();
    },
    /**
     * @public
     * @function
     * Calls teardown on all children, and then self
     */
    teardownActiveDescendants: function() {
      this.traverseDescendants({
        after: function(item){
          if (item.isActive()) {
            item.teardown();
            if (item.parent) {
              item.parent.removeChild(item);
            }
          }
        }
      });
      //TODO: refactor - tearing down "this" means it doesnt do what it says on the tin
      this.teardown();
      this.active = false;
    },
    /**
     * @public
     * @function
     * Calls teardown on all children which are layouts, and then self
     */
    teardownActiveDescendantLayouts: function() {
      this.traverseDescendants({
        after: function(item){
          if (item.isActive() && item.isLayout()) {
            item.teardown();
            if (item.parent) {
              item.parent.removeChild(item);
            }
          }
        }
      });
    }
  });



  /**
   * Gets an array of child partial-views that are active for a given partial-view id
   * @public
   * @function
   * @memberOf AbstractView
   * @returns {Array} an array of partial-view children and children of children, etc which are active. Ordered by lowest-level children first (these always come before their parent)
   */
  AbstractView.prototype.getActiveDescendantPartials = function() {
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
Tyro.PartialViewCollectionItem = function(){};
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
 * The function which is responsible for the tearing down and rendering of Layouts
 * It works out what is currently rendered, what needs to be rendered and what needs to be
 * torn down and in what order all that happens.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} layoutId The id of the PartialViewCollectionItem object i.e. "dashboard"
 */
Tyro.PageController.prototype.render = function(layoutId) {
  if(!layoutId) {
    throw new TypeError("Tyro: PageController: render: Must provide a layoutId");
  }

  var item = this.items[layoutId],
      parent = item.parent;

  item.teardownActiveDescendantLayouts();
//above replaces below
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
