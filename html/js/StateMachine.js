/*
 State Machine Graph functions
 by David Gavilan
 Licence: MIT http://opensource.org/licenses/MIT

 Based on the work of Evan Wallace: Finite State Machine Designer (http://madebyevan.com/fsm/)
*/

// Include these files:
// 	<script src="http://code.jquery.com/jquery.js"></script>
//  <script type="text/javascript" src="js/dracula/raphael-min.js"></script>
//  <script type="text/javascript" src="js/dracula/dracula_graffle.js"></script>
//  <script type="text/javascript" src="js/dracula/dracula_graph.js"></script>
//	<script src="js/js-yaml.js"></script>

/**
 * Main class
 */
function StateMachine(name) {
  this.name = name;
  this.graph = new Dracula.Graph();
  this.layoutMethod = "spring";
  this.layouter = {};
  this.renderer = {};
  this.canvasOffset = {x: 100, y: 150};
}

// -----------------------------------------
// State Machine functions
// -----------------------------------------
StateMachine.prototype.importYAML = function(yamlText)
{
  var json = jsyaml.load(yamlText);
  this.graph = new Dracula.Graph();
  //console.log(json);
  var n;
  // first add the nodes
  for (n in json) { /* loop through the nodes */
    //console.log(json[n]);
    this.graph.addNode(n);
  }
  // now create the links
  for (n in json) {
    for (var targetNode in json[n]) {
      if (targetNode === "attributes") continue; // not a State
      if (!(targetNode in json)) continue; // no such Node
      var edgeData = { style: { directed : true } };
      if (json[n] && json[n][targetNode]) {
        if (json[n][targetNode].when) {
          edgeData.style.label = json[n][targetNode].when;
          edgeData.style["font-size"] = 10;
          edgeData.style["font-family"] = "Helvetica";
        }
      }
      this.graph.addEdge(n, targetNode, edgeData);
    }
  }
  if (Object.keys(this.graph.nodes).length === 0) {
    // create a dummy state machine when there's no data
    this.graph.addNode("Start");
    this.graph.addNode("Exit");
    this.graph.addEdge("Start", "Exit", { style: {directed: true, label: "done", "font-size": 10, "font-family": "Helvetica"}});
  }
  // clear the canvas
  var canvas = document.getElementById('canvas');
  canvas.innerHTML = "";

  this.initLayout();
  this.initRenderer();
};

StateMachine.prototype.initLayout = function()
{
  // layout the graph using the Spring layout implementation
  // The other layouts are broken.
  this.layouter = new Dracula.Layout.Spring(this.graph);
};

StateMachine.prototype.initRenderer = function()
{
  var width = $(document).width() - this.canvasOffset.x;
  var height = $(document).height() - this.canvasOffset.y;
  /* draw the graph using the RaphaelJS draw implementation */
  this.renderer = new Dracula.Renderer.Raphael('#canvas', this.graph, width, height);
  this.renderer.draw();
  this.saveBackup();
};

StateMachine.prototype.redraw = function()
{
  this.layouter.layout();
  this.renderer.draw();
  this.saveBackup();
};

StateMachine.prototype.clear = function()
{
  this.graph = new Dracula.Graph();
  // clear the canvas
  var canvas = document.getElementById('canvas');
  canvas.innerHTML = "";
  this.initLayout();
  this.initRenderer();
};

StateMachine.prototype.exportYAML = function()
{
  var yaml = '';
  for (var n in this.graph.nodes) {
    yaml += n + ":\n";
    /*
    yaml += "  attributes: {x: "+nodes[i].x + ", y: "+nodes[i].y;
    if (nodes[i].color) {
    yaml += ", color: \""+nodes[i].color+"\"";
    }
    yaml += "}\n";
    */
    for (var j = 0; j < this.graph.edges.length; j++) {
      if (this.graph.edges[j].source.id === n) {
        yaml += "  " + this.graph.edges[j].target.id + ": ";
        if (this.graph.edges[j].label) {
          yaml += "{when: \""+this.graph.edges[j].label+"\"}";
        }
          yaml += "\n";
        }
    }
    yaml += "\n";
  }
  return yaml;
};

StateMachine.prototype.exportSVG = function()
{
  var text = '<?xml version="1.0" standalone="no"?>\n';
  text += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
  var canvas = document.getElementById('canvas');
  text += canvas.innerHTML;
  return text;
};

StateMachine.prototype.exportPNG = function()
{
  var canvas = document.getElementById('canvas');
  var svg = canvas.children[0];
  // include svs_todataurl.js !
  svg.toDataURL("image/png", {
  callback: function(data) {
  window.open(data);
  }
  });
};

/// Stores YAML in localStorage http://www.w3schools.com/html/html5_webstorage.asp
StateMachine.prototype.saveBackup = function()
{
  if (!localStorage || !JSON) {
    return;
  }
  localStorage['fsm-name'] = $("#statemachineName").val() || ""; // this.name
  localStorage['fsm-yaml'] = this.exportYAML();
};

StateMachine.prototype.restoreBackup = function()
{
  if (!localStorage || !JSON) {
    return;
  }
  try {
    this.name = localStorage['fsm-name'] || "";
    this.importYAML(localStorage['fsm-yaml'] || "");
    $("#statemachineName").val(this.name);
  } catch (e) {
    console.log(e);
    localStorage['fsm-yaml'] = "";
    localStorage['fsm-name'] = "";
  }
};

// tests
// window.stateMachine.sample1();
StateMachine.prototype.sample1 = function()
{
  var width = $(document).width() - 20;
  var height = $(document).height() - 60;

  this.graph = new Dracula.Graph();

  /* add a simple node */
  this.graph.addNode("strawberry");
  this.graph.addNode("cherry");

  /* add a node with a customized label */
  this.graph.addNode("1", { label : "Tomato" });
  this.graph.addNode("id35", {
      label : "meat\nand\ngreed" //,
  });
  st = { directed: true, label : "Label",
          "label-style" : {
              "font-size": 20
          }
      };
  this.graph.addEdge("kiwi", "penguin", st);

  /* connect nodes with edges */
  this.graph.addEdge("strawberry", "cherry");
  this.graph.addEdge("cherry", "apple");
  this.graph.addEdge("cherry", "apple");
  this.graph.addEdge("1", "id35");
  this.graph.addEdge("penguin", "id35");
  this.graph.addEdge("penguin", "apple");
  this.graph.addEdge("kiwi", "id35");
  /* a directed connection, using an arrow */
  this.graph.addEdge("1", "cherry", { directed : true } );
  /* customize the colors of that edge */
  this.graph.addEdge("id35", "apple", { stroke : "#bfa" , fill : "#56f", label : "Meat-to-Apple" });
  /* add an unknown node implicitly by adding an edge */
  this.graph.addEdge("strawberry", "apple");
  this.graph.removeNode("1");

  // clear the canvas
  var canvas = document.getElementById('canvas');
  canvas.innerHTML = "";

  /* layout the graph using the Spring layout implementation */
  this.layouter = new Dracula.Layout.Spring(this.graph);
  /* draw the graph using the RaphaelJS draw implementation */
  this.renderer = new Dracula.Renderer.Raphael('#canvas', this.graph, width, height);
  this.renderer.draw();
};

// ----------------------------
// Window stuff
// ----------------------------

window.crossBrowserKey = function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
};

window.crossBrowserElementPos = function crossBrowserElementPos(e) {
  e = e || window.event;
  var obj = e.target || e.srcElement;
  var x = 0, y = 0;
  while(obj.offsetParent) {
    x += obj.offsetLeft;
    y += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return { 'x': x, 'y': y };
};

window.crossBrowserMousePos = function crossBrowserMousePos(e) {
  e = e || window.event;
  return {
    'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
};

window.crossBrowserRelativeMousePos = function crossBrowserRelativeMousePos(e) {
  var element = window.crossBrowserElementPos(e);
  var mouse = window.crossBrowserMousePos(e);
  return {
    'x': mouse.x - element.x,
    'y': mouse.y - element.y
  };
};

window.onload = function() {
  // create instance
  window.stateMachine = new StateMachine("MyStateMachine");
  window.stateMachine.restoreBackup();

  /*
  var canvas = document.getElementById('canvas');

  canvas.ondblclick = function(e) {
    if (!window.stateMachine) return;
    if (!window.stateMachine.renderer) return;
    var mouse = window.crossBrowserRelativeMousePos(e);
    var layoutPoint = window.stateMachine.renderer.pointToLayout(mouse);
    //console.log(mouse);
    var nodeNumber = 1;
    while (window.stateMachine.graph.nodes["N"+nodeNumber]) nodeNumber++;
    window.stateMachine.graph.addNode("N"+nodeNumber, {layoutPosX: layoutPoint.x, layoutPosY: layoutPoint.y});
    window.stateMachine.renderer.draw();
  };
  */
};

window.canvasHasFocus = function canvasHasFocus() {
  return (document.activeElement || document.body) == document.body;
};
