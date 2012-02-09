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
      //Functions
      isFunc = Utils.isFunc,
      doNothing = Utils.doNothing,
      klass = Utils.klass;

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
      this.children = null; //{Array} - instantiated on first use
      //provided properties
      this.setParent(parent);
    },
    /*
     * Public Properties
     */
    parent: null,
    setParent: function(p) {
      var oldParent = this.parent;
      if(p !== null && !(p instanceof TreeNode)) {
        //TODO: replace the following once we use *real* inheritance in backoffice, rather than this extend crap
        //throw new TypeError("Tyro: TreeNode: Parent must be null or type TreeNode");
        //TODO: remove the following once we can reinstate the above
        if (!isFunc(p.addChild)) {
          throw new TypeError("Tyro: TreeNode: Parent must be null or type TreeNode");
        }
      }
      if (!!this.parent && !p) {
        throw new Error("Tyro: TreeNode: setParent() cannot be used to remove an existing parent (any head node must be instantiated as one and child nodes cannot become top-level/head)");
      }
      if (this.parent === p) return; //prevent needless recursion

      if (!!p) {
        p.addChild(this);
      }
      this.parent = p; //must be after addChild call, to prevent recursion
      this.parentChanged(oldParent);
    },
    removeFromParent: function(child) {
      var oldParent = this.parent;
      if (!!this.parent) {
        //remove from previous parent
        this.parent.removeChild(child);
        this.parent = null;
        this.parentChanged(oldParent);
      }
    },
    /**
     * Should be overridden in descendant classes to ensure that things such as teardown, etc are called
     * @abstract
     */
    parentChanged: function(oldParent) { },
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
          len = !!this.children ? this.children.length : -1,
          child, i;

      for (i = 0; i < len; i++ ) {
        child = this.children[i];
        if (isFunc(cbs.before) && cbs.before(child) === false) return false;
        if (this.children[i].traverseDescendants(cbs)) return false;
        if (isFunc(cbs.after) && cbs.after(child) === false) return false;
      }
    },
    /**
     * Checks for recursive parents
     */
    _recursiveParentCheck: function(){
      var that = this;
      if (!this.parent) return;
      //use parent's traverse methods so we don't get false positive on first callback
      this.parent.traverseUpwards(function(ancestor){
        if (ancestor === that) {
          throw new Error("Recursive tree detected! Don't make an ancestor a descendant!!");
        }
      });
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
      var oldParent = child.parent;
      if(!(child instanceof TreeNode)) {
        //TODO: replace the following once we use *real* inheritance in backoffice, rather than this extend crap
        //throw new TypeError("Tyro: TreeNode: addChild: Must provide an instance of TreeNode");
        //TODO: remove the following once we can reinstate the above
        if (!isFunc(child.removeFromParent) || !isFunc(child.parentChanged)) {
          throw new TypeError("Tyro: TreeNode: addChild: Must provide an instance of TreeNode");
        }
      }
      if (child.parent === this) return; //nothing to do
      child.removeFromParent(); //remove from previous parent if exists
      this.children = this.children || []; //we create this on first use rather than in constructor - for backward compatibility with different inheritance frameworks. This keeps children off the prototype...
      this.children.push(child);
      child.parent = this; //set child's parent directly, rather than calling setParent() -> we don't want infinite recursion happening now, do we ;-)
      this._recursiveParentCheck();
      child.parentChanged(oldParent);
    },
    /**
     * Finds the index of passed in child
     * @public
     * @function
     * @param {TreeNode} child The child node to find
     * @returns {Integer} index, or NaN if not found
     */
    indexOfChild: function(child) {
      var len = !!this.children ? this.children.length : -1,
          i;
      for (i = 0; i < len; i++) {
        if (this.children[i] === child) {
          return i;
        }
      }
      return parseInt("NaN", 10);
    },
    /**
     * Removes a child node
     * @public
     * @function
     * @param {TreeNode} child The child node to add
     */
    removeChild: function(child) {
      var index = this.indexOfChild(child);
      //could check !isNaN(index) instead, but in case we change to return -1, the following also works
      if (index >= 0) return this.removeChildByIndex(index);
    },
    removeChildByIndex: function(index) {
      var child;
      if (!(this.children instanceof Array)) return;
      child = this.children[index];
      this.children.splice(index,1);
      child.setParent(null); //also calls parentChanged() which will be used for cleanup such as teardown, etc
      return child;
    },
    //methods purely for debugging
    _nodeDepth: function() {
      var i = 0;
      this.traverseUpwards(function(){ i++; });
      return i;
    },
    _nodeDepthString: function() {
      var s = "",
          i = this._nodeDepth();
      while(i--) {
        s += "    ";
      }
      return s;
    }
  });

}());
