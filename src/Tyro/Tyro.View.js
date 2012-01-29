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

  var BaseView = Tyro.BaseView = klass("BaseView", AbstractView, {
    constructor: function(parent) {
      this.inherited(parent);
      this._activationCallbacks = [];
    },
    _respondToActivationCallbacks: function() {
      var callback;
      while(callback = this._activationCallbacks.shift()) {
        callback();
      }
    },
    /**
     * 
     */
    childActivating: function(child, callback){
      var i, index, item,
          that = this;

      callback = callback || doNothing;

      if (!this.isActive()){
        console.log("proper async stuff and getViewData or similar needs to be done for render (or to check that it's a partial view)")
        this.activate(function(){
          that.render();
          callback();
        });
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
      callback();
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
      this.parent.childActivating();
    },
    /**
     * activates the view and calls callback when ready to render (eg when parents are rendered)
     */
    activate: function(callback) {
      var that = this,
          callCallbacks = function(){
            that._respondToActivationCallbacks();
            console.error("TODO: optional arg for activate() method to auto-render? - see comments below");
            //1. not sure if active should be set before or after callbacks
            //2. if the following steps are followed, we end up with errors:
            //   - load page
            //   - in console, do: sectionView.teardown(); contentView.activate(); contentView.render();
            //   - or perhaps we have an "activateParents" method for times we're not going to add
            //   - render() to a callback (i.e. when not async)
            //**** NB!! ****
            //Current workaround for the above, do the following:
            // sectionView.teardown(); contentView.activateAndRenderParents(); contentView.render();
            that.active = true;
            that.activating = false;
          };

      this.activating = true;

      this._activationCallbacks.push(callback);

      if (this.isActive() || !this.parent) {
        callCallbacks();
        return; //========> nothing more to do...
      }

      //parent.childActivating also tears down any active child views with same container
      this.parent.childActivating(this, callCallbacks); 
    },
    teardown: function(){
      this.inherited();
      $(this.container).empty();
    },
    render: function(){
      var $container, html;

      if (this.isActive() && !this.activating) {
        throw new Error("Render called on active view when this.activating is false - did you forget to teardown the view first?");  
      }

      $container = $(this.container);
      if ($container.length < 1) {
        throw new Error("Attempt to render view with unrendered container");
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
