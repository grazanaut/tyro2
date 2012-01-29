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
      View = Tyro.View,
      //Functions
      isFunc = Utils.isFunc,
      doNothing = Utils.doNothing,
      klass = Utils.klass;


  console.error("render method or similar should check that a parent view actually contains the container the child requires, somehow... (so child doesnt replace parent's parent,etc if wrong heirarchy defined)");
  console.log("Hello, World");

  var DemoView = klass("DemoView", View, {
    renderCount: 0,
    teardownCount: 0,
    render: function(){
      this.inherited();      
      this.renderCount++;
      this.logRenders();
    },
    teardown: function(){
      this.inherited();      
      this.teardownCount++;
      this.logRenders();
    },
    logRenders: function(){
      function fn(item){
        console.warn(item.____className + " rendered: " + item.renderCount + " torndown: " + item.teardownCount);
      }
      var head = this.getHead();
      fn(head);
      head.traverseDescendants({ before: fn });
    }
  });

  var PageView = klass("PageView", DemoView, {
    constructor: function(parent) {
      this.inherited(parent);
      this.container = "#topLevelContainer";
      this.templateId = "#page";
    }
  });

  var SectionView = klass("SectionView", DemoView, {
    constructor: function(parent) {
      this.inherited(parent);
      this.container = "#pageContent";
      this.templateId = "#section";
    }
  });

  var ContentView = klass("ContentView", DemoView, {
    constructor: function(parent) {
      this.inherited(parent);
      this.container = "#sectionContent";
      this.templateId = "#content";
    }
  });

  $(document).ready(function(){
    //attach to window so vars are exposed for testing by direct manipulation in dev tools console
    window.pageView = new PageView(null);
    window.sectionView = new SectionView(pageView);
    window.contentView = new ContentView(sectionView);
    //pageView.render();
    contentView.activate(function(){
      contentView.render();
    });
  });

  //TODO: perhaps name this JSVC instead (javascript view controller - as there's no models)
  //TODO: investigate observer pattern for template views which currently publish messages for controllers?

}());//end of module closure/wrapper method
