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
      klass = Utils.klass;

  var View = Tyro.View = klass("View", AbstractView, {
    constructor: function(parent) {
      this.inherited(parent);
      this._activationCallbacks = [];
      this._renderOnActivate = false; //default - ONLY set this to true IFF rendering is not asyncronous - i.e. we know that we dont need to load template, data, etc from ajax
      this._activating = false;
    },
    _respondToActivationCallbacks: function() {
      var callback;
      this.active = true;
      this._activating = false;
      while(this._activationCallbacks.length > 0) {
        callback = this._activationCallbacks[0];
        if (callback !== doNothing) {
          callback();
        }
        this._activationCallbacks.shift(); //must be done *after* the callback is called as isActivating() is based on length of this array
      }
    },
    _addActivationCallback: function(callback) {
      this._activationCallbacks.push(callback);
      this._logIt("added new callback: " + callback.toString().replace(/(\r\n|\n|\r)/gm," "));

    },
    _logIt: function(m){
      console.log(this._nodeDepthString() + this.constructor.name + " (container: '" + this.container + "'): " + m);  
    },
    isActivating: function() {
      return (this._activating || this._activationCallbacks.length > 0);
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
      for (i = 0; i < this.children.length; i++) {
        item = this.children[i];
        //only teardown if it was in the same container, but is *not* the same child
        if (item !== child && item.container === child.container) {
          this.children[i].teardown();
        }
      }

      this.fire("Rendered"); //lets observing children know we are ready
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
      this.parent.childActivating(this);
    },
    /**
     * activates the view and calls callback when ready to render (eg when parents are rendered)
     */
    activate: function(callback) {

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
    teardown: function(){
      this.inherited(); //also sets active = false
      this.parent.detach("Rendered", this._respondToActivationCallbacks, this);
      this.parent.detach("Rendered", this._internalDoRender, this);
      this._activationCallbacks = []; //remove
      this._activating = false;
    },
    _internalDoRender: function() {
        this.active = true; //prevent infinite recursion/iteration
        this.render();
        this.fire("Rendered");//TODO: move into render() method?
        this._activating = false;
    },
    render: function(){
      this.inherited();
    }
  });

}());
