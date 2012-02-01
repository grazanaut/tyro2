/*
  @namespace  Holds functionality relating to Tyro.
*/
var Tyro = Tyro || {};

(function() {

  Tyro.Controller = function(config) {

    this.routes      = config.routes;
    this.viewManager = config.viewManager;

  };


  Tyro.Controller.prototype = {
    

    //  public


    /*
      @description  registers a route and handler
      @param        {string}    route
      @param        {function}  func
      @param        {object}    [options]
    */
    addRoute: function(route, func, options) {
      
      if(typeof func === "string") {
        func = this[func];
      }

      if(typeof func !== "function") {
        throw new Error("Tyro.Controller#addRoute expects a function as a callback");
      }

      this.routes.addRoute(route, func.bind(this), options);

    },

    

    bind: function(func, scope) {
      
      return $.proxy(func, scope);

    },





    extend: function() {
      
      return $.extend.apply($, arguments);

    },






    /*
      @description  retrieves the view identifier that the viewManager requires
      @param        {object} options
      @return       {string}
    */
    getViewIndex: function() {
      
      throw new Error("Tyro.Controller#getViewIndex must be implemented further up the prototype chain.");

    },




    /*
      @description  publishes data on channel
      @param        {string} channel
      @param        {array}  args
    */
    publish: function(channel, args) {

      $.publish(channel, args);

    },




    /*
      @description  redirects the application to a new URI
      @param        {string}    route
    */
    redirect: function(route) {
      
      this.routes.setHash(route);

    },





    /*
      @description  sets the active view and shows the loading indicator
      @param        {object}    view
      @param        {object}    [options]
    */
    setActiveView: function(view, options) {

      var parent, viewIndex;

      this.activeView = view;

      viewIndex = this.getViewIndex(options || {});
      parent = this.viewManager[viewIndex];

      view.setParent(parent);
      view.activate();
      view.showLoader();

    },





    /*
      @description  registers a subscriber with a publication channel
      @param        {string}    route
      @param        {function}  func
      @param        {object}    [options]
    */
    subscribe: function(channel, func) {

      if(typeof func === "string") {
        func = this[func];
      }

      if(typeof func !== "function") {
        throw new Error("Tyro.Controller#subscribe expects a function as a callback");
      }

      $.subscribe(channel, func.bind(this));

    },


    //  private


    /*
      @description  scans the instance for any method names starting with a leading slash and binds
                    the method to the route
                    the value of this[methodName] can be either a string or a method
      @param        {object} options
    */
    _autoBindRoutes: function(options) {
      
      var methodName, func;

      for(methodName in this) {
        
        if(/^\//.test(methodName)) {
          
          func = typeof this[methodName] === "function" ? this[methodName] : this[this[methodName]];

          this.addRoute(methodName, func, options);

        }

      }

    }

  };

}());