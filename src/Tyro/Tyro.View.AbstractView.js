/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

(function() {

  /*
   * Import utility methods and namespaces into the local scope
   * //TODO: find jsDoc tags for importing namespaces and/or methods into scope
   */
  var 
      //Namespaces
      Utils = Tyro.Utils,
      //Klasses
      TreeNode = Tyro.TreeNode,
      //Functions
      isFunc = Utils.isFunc,
      doNothing = Utils.doNothing,
      klass = Utils.klass;

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
    //TODO: active probably means non-persistent (i.e. not menu, etc) - change name of this? (or do we need to?)
    isActive: function(){
      return this.active;
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
      var i = this.children.length;
      while (i--) {
        this.children[i].teardown();
        //We no longer remove children from the tree when tearing down
        // - They are either active and rendered, or torndown and inactive. The only
        //   time we remove them is if they are being attached to a different parent
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
    //TODO: check if this method is used - remove if not
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
    //TODO: check if this method is used - remove if not
    teardownActiveDescendantLayouts: function() {
      this.traverseDescendants({
        after: function(item){
          if (item.isActive() && item.isLayout()) {
            item.teardown();
            //if (item.parent) {
            //  item.parent.removeChild(item);
            //}
          }
        }
      });
      //TODO: refactor - tearing down "this" means it doesnt do what it says on the tin
      this.teardown();
      this.active = false;
    },
    /** 
     * Tears down any 
     * @public
     * @function
     * @param {String} container
     */
    teardownDescendantsInContainer: function(container) {
      throw new Error("Safer way to do this? - we need to make sure that only child views can replace other children?");
      for (var i = 0; i < this.children.length; i++) {
        if (this.children.container === container) {
          this.children[i].teardown();
          return;
        }
      }
    }

  });

}());
