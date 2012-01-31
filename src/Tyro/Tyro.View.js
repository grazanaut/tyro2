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
    },
    _respondToActivationCallbacks: function() {
      var callback;
      this.active = true;
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
      return (this._activationCallbacks.length > 0);
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

      function internalRender() {
        this.render();
        this.fire("Rendered");
      }

      if (this.isActive()) {
        isFunc(callback) && callback();
        return;
      }

      if (this.isActivating()) {
        isFunc(callback) && this._addActivationCallback(callback);
        return;
      }

      //add this *after* the isActivating() call - as that call uses _activationCallbacks.length to check      
      isFunc(callback) && this._addActivationCallback(callback);

      if (!this.parent) {
        if (!!this._renderOnActivate) {
          this.render();
          this.fire("Rendered");//TODO: move into render() method?
        }
        this._respondToActivationCallbacks();
        return;
      }

      if (!!this._renderOnActivate) {
        this.parent.once("Rendered", internalRender, this);
      }

      this.parent.once("Rendered", this._respondToActivationCallbacks, this);
      this.parent.childActivating(this);
    },
    teardown: function(){
      this.inherited();
      $(this.container).empty();
    },
    render: function(){
      var $container, html;

      if (this.isActive() && !this.isActivating()) {
        throw new Error("Render called on active view when this.isActivating() is false - did you forget to teardown the view first?");  
      }

      $container = $(this.container);
      if ($container.length < 1) {
        throw new Error("Attempt to render view " + (this.constructor.name || this.____className) + " with unrendered container " + this.container);
      }

      html = $(".templates").find(this.templateId).html();
      $container.html(html);

      //TODO: currently a hack for the demo, to add ids to templates (we don't want in real ids until templates are rendered)
      $container.find("[data-id]").each(function(idx,item){
        item = $(item);
        item.attr("id",item.attr("data-id"));        
      });

    }
  });

}());
