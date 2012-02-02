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
      this.inherited(parent);

      this.id = id;
      this.active = false;

    },
    //Observable-style properties and methods
    _ob: function(prop) {
      if (!this[prop]) {
        this[prop] = {};
      }
      return this[prop];
    },
    _observers: function() {
      //create in a method to guard against non-constructor inheritance issues (ensure separate instance per object, not per prototype)
      return this._ob("_observersHash");
    },
    _onceObservers: function() {
      //create in a method to guard against non-constructor inheritance issues (ensure separate instance per object, not per prototype)
      return this._ob("_onceObserversHash");
    },
    _internalAddObserver: function(hash, message, callback, scope) {
      var obs = hash[message] = hash[message] || [];
      obs.push({
        callback: callback,
        scope: scope
      }); 
    },
    // Observes and then removes the observer once the event has triggered
    once: function(message, callback, scope) {
      this._internalAddObserver(this._onceObservers(), message, callback, scope);
    },
    on: function(message, callback, scope) {
      this._internalAddObserver(this._observers(), message, callback, scope);
    },
    fire: function(message) {
      var obs, ob, i;
      obs = this._onceObservers()[message];
      if (obs instanceof Array) {
        while (ob = obs.shift()) {
          ob.callback.call(ob.scope, this);
        }
      }
      obs = this._observers()[message];
      if (obs instanceof Array) {
        for (i = 0; i < obs.length; i++) {
          obs[i].callback.call(obs[i].scope, this);
        }
      }
    },
    detach: function(message, callback, scope) {
      function _detatch(obs) {
        var i;
        i = (obs && obs.length) || 0;
        while (i--) {
          if (
              (!!scope && !!callback && obs[i].scope === scope && obs[i].callback === callback) ||
              (!!scope && !callback && obs[i].scope === scope) ||
              (!scope && !!callback && obs[i].callback === callback)
             ) {
            obs.splice(i,1);
          }
        }
      }
      if (typeof message !== "string") {
        throw new Error("Tyro.AbstractView#detach: message is a mandatory argument!");
      }
      if (typeof callback !== "function") {
        scope = callback;
        callback = null;
      }
      _detatch(this._onceObservers()[message]);
      _detatch(this._observers()[message]);
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
     * Ensure that teardown is called if parent changes
     * @override
     */
    parentChanged: function(oldParent) {
      this.teardown();
      this.fire("ParentChanged");
    },
    /**
     * @abstract
     * Child Classes should override this method to implement teardown behaviours
     */
    doTeardown: function(){}, //TODO: may not be needed if inheritance used properly and teardown not clobbered

    /**
     * @public
     * @function
     * Calls teardown on all children, and then self
     */
    teardown: function() {

      if (!this.isActive()) return; //don't waste time

      //children first
      var i = this.children ? this.children.length : 0;
      while (i--) {

        if (this.children[i].isActive()) {
          this.children[i].teardown();
          //We no longer remove children from the tree when tearing down
          // - They are either active and rendered, or torndown and inactive. The only
          //   time we remove them is if they are being attached to a different parent
        }

      }
      this.active = false; //todo: should this be before or after doTeardown?
      //then self
      this.doTeardown(); //TODO: may not be needed if inheritance used properly and teardown not clobbered
    },
    /** 
     * Tears down any 
     * @public
     * @function
     * @param {String} container
     */
    teardownDescendantsInContainer: function(container) {
      throw new Error("Safer way to do this? - we need to make sure that only child views can replace other children?");
      for (var i = 0; this.children && i < this.children.length; i++) {
        if (this.children.container === container) {
          this.children[i].teardown();
          return;
        }
      }
    }

  });

}());
