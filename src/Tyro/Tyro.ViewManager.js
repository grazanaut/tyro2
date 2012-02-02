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

  var ViewManager = Tyro.ViewManager = klass("ViewManager", Object, {
    constructor: function() {
    },
    _ensureViews: function() {
      //to allow for $.extend style inheritance, don't create this array in constructor, so it's created on the instance rather than prototype
      this.views = this.views || [];
    },
    addTopLevelView: function(view) {
      if (view.parent) {
        throw new Error("Only top-level views can be added to view manager");
      }
      this._ensureViews();
      this.views.push(view);
      view.on("Activating", this._teardownViewsOtherThan, this);
      view.on("Rendering", this._teardownViewsOtherThan, this);
      view.on("ParentChanged", this._detachObservers, this);
    },
    _detachObservers: function(view) {
      //if parent is no longer null, we don't care about observing or tracking - the other views in the tree do this for us
      var i = this.views.length;
      while (--i) {
        if (view !== this.views[i]) {
          this.views.splice(i,1);
        }
      }
      if (!!view.parent) {
        view.detach("Activating", this._teardownViewsOtherThan, this);
        view.detach("Rendering", this._teardownViewsOtherThan, this);

      }
    },
    _teardownViewsOtherThan: function(view) {
      for (var i = 0; i < this.views.length; i++) {
        if (view !== this.views[i]) {
          view.teardown();            
        }
      }
    }
  });

}());
