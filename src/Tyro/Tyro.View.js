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
 * A tree node from which base view will inherit
 * References to these items are also stored in a flat (non-tree) hashmap as Tyro.PageController.items
 * NOTE: this is a double-linked-tree structure. As a result, be *very* careful of any deep-copy/extend/compare
 *       routines as they *will* result in stack overflow
 * @class
 * @abstract 
 * @constructor
 * @memberOf Tyro
 * @param {Tyro.TreeNode} parent The parent item (or null)
 */
Tyro.TreeNode = function(parent) {

  // to be overridden in child classes
  this.id = null;

  if(parent !== null && !(parent instanceof Tyro.TreeNode)) {
    throw new TypeError("Tyro: TreeNode: constructor: Must provide a parent of null or type TreeNode");
  }

  //other properties
  this.parent = parent;
  this.parentId = null;
  if (parent) {
    this.parentId = parent.id;
    parent.children.push(this);
  }
  this.children = [];
};

/**
 * Gets the top level (head) of the partial view by traversing up the chain of parents
 * @public
 * @function
 * @memberOf Tyro.TreeNode
 * @returns {Tyro.TreeNode} The head/top item
 */
Tyro.TreeNode.prototype.getHead = function() {
  var v = this;
  while (!!v.parent) {
    v = v.parent;
  }
  return v;
};

/**
 * Iterates/recurses all children with a given callback, and optional filter to stop iteration
 * @public
 * @function
 * @memberOf Tyro.TreeNode
 * @param {Function(Tyro.TreeNode)} callback The callback method for each node found.
 *                                           If it returns false (false, not undefined), 
 *                                           it will stop iteration on that branch
 */
Tyro.TreeNode.prototype.iterateChildren = function(callback) {
  for (var i = 0; i < this.children.length; i++ ) {
    if (callback(this.children[i]) === false) { //callback must explicitly return false, not just undefined, to stop iteration
      continue; //=============> callback flagged not to go any further on this branch
    }
    this.children[i].iterateChildren(callback);
  }
};

/**
 * Iterates all THIS and all parents, stopping if callback returns false
 * @public
 * @function
 * @memberOf Tyro.TreeNode
 * @returns {Function(Tyro.TreeNode)} callback The callback method for each node.
 *                                           If it returns false (false, not undefined), 
 *                                           it will stop iteration on that branch
 */
Tyro.PartialViewCollectionItem.prototype.iterateUpwards = function(callback) {
  if (callback(this) !== false) { //must explicitly return false and not just undefined, to stop iteration
    if (!!this.parent) {
      this.parent.iterateUpwards(callback);
    }
  }
};


