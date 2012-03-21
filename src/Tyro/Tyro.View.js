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
      AbstractView = Tyro.AbstractView,
      //Functions
      isFunc = Utils.isFunc,
      doNothing = Utils.doNothing,
      klass = Utils.klass,
      //module singletons
      deprecationWarnings = {
        onBeforeTeardown: 0
      };

  var View = Tyro.View = klass("View", AbstractView, {
    constructor: function(parent, options) {
      this.inherited(parent);
      this._renderOnActivate = !!(options && options.renderOnActivate); //ONLY set this to true IFF rendering is not asyncronous - i.e. we know that we dont need to load template, data, etc from ajax
      this._activating = false;
    },
    _respondToActivationCallbacks: function() {
      var callback;
      this.active = true;
      this._activating = false;
      if (!this._activationCallbacks) return;
      while(this._activationCallbacks.length > 0) {
        callback = this._activationCallbacks[0];
        if (callback !== doNothing) {
          callback();
        }
        this._activationCallbacks.shift(); //must be done *after* the callback is called as isActivating() is based on length of this array
      }
    },
    _addActivationCallback: function(callback) {
      if (!this._activationCallbacks) {
        //dont create in constructor - guard against inheritance types which may attach this to prototype rather than instance
        this._activationCallbacks = [];
      }
      this._activationCallbacks.push(callback);
      //this._logIt("added new callback: " + callback.toString().replace(/(\r\n|\n|\r)/gm," "));

    },
    _logIt: function(m){
      //console.log(this._nodeDepthString() + this.constructor.name + " (container: '" + this.container + "'): " + m);
    },
    isActivating: function() {
      return (this._activating || (this._activationCallbacks && this._activationCallbacks.length > 0));
    },
    /**
     * Called when a parent has been notified that a child has been added
     */
    childAdded: function(child) {
      child.on("Rendered", this._childRendered, this);
    },
    /**
     * Called when a parent has been notified that a child has been removed
     */
    childRemoved: function(child) {
      child.detach("Rendered", this._childRendered, this);
    },
    /**
     * Called when a child has been rendered
     */
    _childRendered: function(child) {
      this.fire("ChildRendered");
    },
    /**
     *
     */
    childActivating: function(child) {

      if (!this.isActive()) {
        this.activate();
        return;
      }

      index = this.indexOfChild(child);

      if (isNaN(index) || index < 0){ //i.e. if child not a child of this
        throw new Error("childActivating was not called with a view that is actually a child!");
      }

      this._teardownOtherChildrenWithSameContainer(child);

      this.fire("Rendered"); //lets observing children know we are ready
    },
    _teardownOtherChildrenWithSameContainer: function(child) {
      var i, item,
          len = !!this.children ? this.children.length: -1;
      for (i = 0; i < len; i++) {
        item = this.children[i];
        //only teardown if it was in the same container, but is *not* the same child
        if (item !== child && item.container === child.container && item.isActive()) {
          item.teardown();
        }
      }

    },
    /**
     * activates and renders parents if need be (also tears down "this" view)
     * Note: this is a *synchronous* call - parents must not use async templating or rendering
     *       if this is used before rendering a view, otherwise containers may not be available
     */
    //TODO: raise error if we somehow know that parent requires async (make async/sync property perhaps?)
    activateAndRenderParents: function() {
      if (!this.parent) {
        throw new Error("activateAndRenderParents called with null parent!");
      }
      //TODO: consider whether events should be used here rather than a direct call by child
      this.parent.childActivating(this);
    },
    /**
     * activates the view and calls callback when ready to render (eg when parents are rendered)
     */
    activate: function(callback) {
      this.fire("Activating");

      if (this.isActive()) {
        isFunc(callback) && callback();
        return;
      }

      if (this.isActivating()) {
        isFunc(callback) && this._addActivationCallback(callback);
        return;
      }

      //add this *after* the isActivating() call - as that call uses _activationCallbacks.length || this._activating to check
      this._activating = true;
      isFunc(callback) && this._addActivationCallback(callback);

      if (!this.parent) {
        if (!!this._renderOnActivate) {
          this._internalDoRender();
        }
        this._respondToActivationCallbacks();
        return;
      }

      if (!!this._renderOnActivate) {
        this.parent.once("Rendered", this._internalDoRender, this);
      }

      this.parent.once("Rendered", this._respondToActivationCallbacks, this);
      this.parent.childActivating(this);
    },
    beforeTeardown: function() {}, //child views should override
    afterTeardown: function() {}, //child views should override
    cleanupDomReferences: function() {}, //child views should override (delete jQuery references to containers, elements, etc from view)
    removeFromDom: function() {}, //child views should override (remove view from Document)
    teardownComponents: function() {}, //child views should override //TODO: not entirely sure this should be here- put back into GD once we have proper inheritance
    _internalDoRemoveEvents: function() {}, //TODO: not happy, see teardown method

    teardown: function(){

      if (!this.teardownCount) this.teardownCount = 0;
      this.teardownCount++;


      this.inherited(); //tears down children, also sets active = false

      if (isFunc(this.onBeforeTeardown)) {
        this.onBeforeTeardown();
        if (deprecationWarnings.onBeforeTeardown++ < 5) {
          //arbitrary number of warnings, but lets not hassle people *too* much...
          //TODO: turn this back on from time-to-time to check how things are progressing in the backoffice
          //console.warn("View(" + this.constructor.name + this.container + ")#onBeforeTeardown is deprecated - use beforeTeardown() instead");
        }
      }
      this.beforeTeardown();
      this.teardownComponents(); //TODO: not entirely sure this should be here- put back into GD once we have proper inheritance
      this._internalDoRemoveEvents(); //TODO: again, not entirely happy....as above
      this.removeFromDom();

      if (!!this.parent) {
        this.parent.detach("Rendered", this._respondToActivationCallbacks, this);
        this.parent.detach("Rendered", this._internalDoRender, this);
      }
      this._activationCallbacks = []; //remove
      this._activating = false;

      this.cleanupDomReferences();
      this.afterTeardown();
    },
    _internalDoRender: function() {
      this.render();
    },
    /**
     * Renders the view
     * Note that any override of this *must* start by calling this._rendering()
     * and finish by calling this._doneRender()
     * For Asynchronous overrides of this method, _doneRender() should be called
     * after the actual render (i.e. in the async callback)
     */
    render: function(){
      this._rendering();
      this.inherited();
      this._doneRender();
    },
    _doneRender: function() {
      this.fire("Rendered");
      this._activating = false;
    },
    _rendering: function() {
      this.fire("Rendering");
      this.active = true; //prevent infinite recursion/iteration
      if (!!this.parent) {
        //TODO: not entirely happy with this - calling some mutator of parent. Maybe we should have a "childRendering" method instead, or an event trigger?
        this.parent._teardownOtherChildrenWithSameContainer(this);
      }
    }
  });

}());
