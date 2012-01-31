/*
  @namespace  Holds functionality relating to Tyro.
*/
var Tyro = Tyro || {};

(function() {

  Tyro.Controller = function(app) {

    //  are we passed a valid application/config object
    this._validateApp(app);

    this.app = app;

  };


  Tyro.Controller.prototype = {
    

    //  public

    /*
      @description  tells the views to prepare for a render pass
                    pageController.render sets up the layout of the page
                    pageController.addChildView attaches the view to layout
      @param        {string}    route
      @param        {function}  func
      @todo         Refactor out the pageController when it is removed from Tyro.2
    */
    activateView: function(viewIndex, view) {

      this.app.pageController.render(viewIndex);
      this.app.pageController.addChildView(viewIndex, view);
      
    },



    /*
      @description  registers a route and handler with the "app" 
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

      this.app.routes.addRoute(route, func.bind(this), options);

    },




    /*
      @description  Check the users access level against the page type
                    the user is forwarded to a 404 if not allowed.
      @param        {string} pageName
      @return       {boolean} 
    */
    checkAccess: function(pageName) {
      
      return this.app.checkAccess(pageName);

    },





    /*
      @description  Check whether the user is not signed in. If they are signed in
                    the user is forwarded to the dashboard page.
      @return       {boolean} 
    */
    checkNotSignedIn: function() {
      
      return this.app.checkNotSignedIn;

    },



    /*
      @description  Check whether the user is not signed in. If they are not signed in
                    the user is forwarded to the sign in page.
      @return       {boolean} 
    */
    checkSignedIn: function() {
      
      return this.app.checkSignedIn;

    },




    /*
      @description  retrieves the default paramaters supplied by the application
      @return       {object} 
    */
    getDefaults: function() {
      
      return this.app.defaults;

    },


    /*
      @description  retrieves a model from the instance of the model manager
      @param        {string} modelName
      @return       {object} 
    */
    getModel: function(modelName) {
      
      return this.app.models.getModel(modelName);

    },




    /*
      @description  retrieves the section identifier that the controller & views need
      @param        {object} options
      @return       {string}
    */
    getSection: function(options) {
      
      return this.section;

    },




    /*
      @description  redirects the application to a new URI
      @param        {string}    route
    */
    redirect: function(route) {
      
      this.app.routes.setHash(route);

    },





    /*
      @description  sets the active view and shows the loading indicator
      @param        {object}    [view]
    */
    setActiveView: function(view, options) {

      this.activateView(this.getSection(options || {}), view);
      view.showLoader();
      this.activeView = view;

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

    },



    /*
      @description  runs a set of tests against the incoming app object
                    a glorified duck typing check until we can refactor
                    the unhloy mess that is the *app* into something
                    more structured
      @param        {object} app
    */
    _validateApp: function(app) {

      function validate(property, member, value) {

        if(typeof value === "undefined") {

          if(typeof app[property] !== member) {
            throw new Error("Tyro.Controller#constructor requires initialisation with '" + member + "'' app." + property);
          }

        }
        else {
          
          if(typeof app[property] === "undefined") {
            throw new Error("Tyro.Controller#constructor requires initialisation with app." + property);
          }  

          if(typeof app[property][member] !== value) {
            throw new Error("Tyro.Controller#constructor requires initialisation with '" + value + "'' app." + property + "." + member);
          }  

        } 
        
      }

      //  routes
      validate("routes", "addRoute", "function");
      validate("routes", "setHash", "function");

      //  models
      validate("models", "getModel", "function");

      //  pageController
      validate("pageController", "render", "function");
      validate("pageController", "addChildView", "function");

      //  objects
      validate("user", "object");
      validate("defaults", "object");

      //  functions
      validate("checkSignedIn", "function");      
      validate("checkNotSignedIn", "function");      
      validate("checkAccess", "function");      
      
    }

  };

}());