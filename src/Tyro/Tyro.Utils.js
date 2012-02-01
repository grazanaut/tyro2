/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

(function() {

  /**
   * @namespace
   * Holds the utils from below that we want to be made publicly available
   * *Forward declaration* -> these are defined below. Not sure if there are jsDoc tags to indicate this
   */
  Tyro.Utils = {
  	isFunc: isFunc,
  	doNothing: doNothing,
  	klass: klass
  };

  /**
   * @private
   * This is the only method we don't export, as it's only useful within here
   */
  function defaultConstructor() {
    if (isFunc(this.inherited)) {
      this.inherited.apply(this, arguments);
    }    
  }

  function isFunc(fn) {
    return typeof fn === "function";
  }

  function doNothing() {};

  /**
   * Simple inheritance behaviour, giving access to "this.inherited()" in methods
   * @param {String} className The name of the new class
   * @param {Function} Base The base class (function because the constructor function should be passed in)
   * @param {Object} classDef Definition of new class. If provided with a "constructor" property, this will be executed when the class is "newed"
   * @example usage var NewClass = klass("NewClass", Base, { constructor: function() {} });
   */
  function klass(className, Base, classDef){

    var p, prop, baseProp, Class,
        _extendingWith = Base._extendingWith,
        basePt = Base.prototype;

    //check hasOwnProperty() to ensure it's a defined constructor and not the "[native code]" one from the prototype
    if (typeof classDef.constructor === "undefined" || !classDef.hasOwnProperty("constructor")) {
      classDef.constructor = defaultConstructor;
    }
    else if (!isFunc(classDef.constructor)) {
      throw new Error("defining klass() " + className + " ==> constructor property must be a method!");
    }

    classDef._constructor = classDef.constructor;

    //we have constructor in new ._constructor property,
    //so we delete .constructor to prevent needless iteration later
    //as we'll set constructor to *actual* constructor later
    delete classDef.constructor;

    //define the new class
    Class = function(){
      this.____className = className;
      //call the constructor IF defined AND we're actually constructing and
      //not merely extending with a sub class
      var thisClass = this.constructor;
      if (!thisClass._extendingWith && isFunc(this._constructor)) {
        this._constructor.apply(this, arguments);
      }
    };
    
    //do the standard prototypal inheritance
    //but we need to tell the base class not to call the _constructor method
    //as it's being extended, not being instantiated
    Base._extendingWith = Class;
    Class.prototype = new Base();
    if (typeof _extendingWith === "undefined") {
      delete Base._extendingWith;
    }
    else {
      Base._extendingWith = _extendingWith;
    }

    //define our closure-creation method for creating inherited() functionality
    function overrideMethod(baseFn, childFn){
      return function() {
        var returnVal, _inherited;
        //store inherited in case it already exists
        _inherited = this.inherited;
        //make inherited() the base method, or an empty method if no base exists
        //TODO: whether to raise exception or not, unsure - for now we just stub out the base
        if (isFunc(baseFn)) {
          this.inherited = baseFn;
        }
        else {
          this.inherited = doNothing;	
        }
        //call childFn now that inherited() exists
        returnVal = childFn.apply(this, arguments);
        //reset this.inherited
        this.inherited = _inherited;

        return returnVal;
      };
    }

    //add the classDef properties to the prototype, catering for overridden methods
    for (p in classDef) {
      prop = classDef[p];
      baseProp = basePt[p];
      if (isFunc(prop)) {
        //*always* call override (even if baseProp doesnt exist)
        //otherwise if a child of prop calls inherited() (inherited becomes prop), and prop calls inherited, it means that prop will recurse infinitely
        //eg:
        //  class A (doesnt have method f)
        //  class B (has method f, calls inherited() because developer is a goon)
        //  class C (has method f, calls inherited())
        //  because B.f isn't wrapped (because class A doesn't have f), B.inherited() points to B.f()
        prop = overrideMethod(baseProp, prop);     	
      }
      else {
        if (isFunc(baseProp)) {
          throw new Error("Attempt to override function with non-function");
        }
      }
      Class.prototype[p] = prop;
    }

    //do the standard constructor reset, so instanceof, etc works as expected
    Class.prototype.constructor = Class;

    //return the new class
    return Class;
  } 
  
  
  
//utility methods that were private to PageController module. No longer used, but may be useful, so keeping
var UnusedUtils = {
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
 
  	
}());