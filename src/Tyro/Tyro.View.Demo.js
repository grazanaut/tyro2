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
         
      this.renderCount++;
      this.logRenders();
    },
    teardown: function(){
      this.inherited();   
         
      $(this.container).empty();
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
      this._renderOnActivate = true;
    }
  });

  var SectionView = klass("SectionView", DemoView, {
    constructor: function(parent) {
      this.inherited(parent);
      this.container = "#pageContent";
      this.templateId = "#section";
      this._renderOnActivate = true;
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
