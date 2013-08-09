/*
 *  Dracula Graph Layout and Drawing Framework 0.0.3alpha
 *  (c) 2010 Philipp Strathausen <strathausen@gmail.com>, http://strathausen.eu
 *  Contributions by Jake Stothard <stothardj@gmail.com>.
 *
 *  based on the Graph JavaScript framework, version 0.0.1
 *  (c) 2006 Aslak Hellesoy <aslak.hellesoy@gmail.com>
 *  (c) 2006 Dave Hoover <dave.hoover@gmail.com>
 *
 *  Ported from Graph::Layouter::Spring in
 *    http://search.cpan.org/~pasky/Graph-Layderer-0.02/
 *  The algorithm is based on a spring-style layouter of a Java-based social
 *  network tracker PieSpy written by Paul Mutton <paul@jibble.org>.
 *
 *  This code is freely distributable under the MIT license. Commercial use is
 *  hereby granted without any cost or restriction.
 *
 *  Links:
 *
 *  Graph Dracula JavaScript Framework:
 *      http://graphdracula.net
 *
 /*--------------------------------------------------------------------------*/

/*
 * Edge Factory
 */
var AbstractEdge = function() {
}
AbstractEdge.prototype = {
    hide: function() {
        this.connection.fg.hide();
        this.connection.bg && this.bg.connection.hide();
    }
};
var EdgeFactory = function() {
    this.template = new AbstractEdge();
    this.template.style = new Object();
    this.template.style.directed = false;
    this.template.weight = 1;
};
EdgeFactory.prototype = {
    build: function(source, target) {
        var e = jQuery.extend(true, {}, this.template);
        e.source = source;
        e.target = target;
        return e;
    }
};

/*
 * Graph
 */
var Graph = function() {
    this.nodes = {};
    this.edges = [];
    this.snapshots = []; // previous graph states TODO to be implemented
    this.edgeFactory = new EdgeFactory();
};
Graph.prototype = {
    /* 
     * add a node
     * @id          the node's ID (string or number)
     * @content     (optional, dictionary) can contain any information that is
     *              being interpreted by the layout algorithm or the graph
     *              representation
     */
    addNode: function(id, content) {
        /* testing if node is already existing in the graph */
        if(this.nodes[id] == undefined) {
            this.nodes[id] = new Graph.Node(id, content);
        }
        return this.nodes[id];
    },

    addEdge: function(source, target, style) {
        var s = this.addNode(source);
        var t = this.addNode(target);
        var edge = this.edgeFactory.build(s, t);
        jQuery.extend(edge.style,style);
        s.edges.push(edge);
        this.edges.push(edge);
        // NOTE: Even directed edges are added to both nodes.
        t.edges.push(edge);
    },
    
    /* TODO to be implemented
     * Preserve a copy of the graph state (nodes, positions, ...)
     * @comment     a comment describing the state
     */
    snapShot: function(comment) {
        /* FIXME
        var graph = new Graph();
        graph.nodes = jQuery.extend(true, {}, this.nodes);
        graph.edges = jQuery.extend(true, {}, this.edges);
        this.snapshots.push({comment: comment, graph: graph});
        */
    },
    removeNode: function(id) {
        delete this.nodes[id];
        for(var i = 0; i < this.edges.length; i++) {
            if (this.edges[i].source.id == id || this.edges[i].target.id == id) {
                this.edges.splice(i, 1);
                i--;
            }
        }
    },
    // Returns a node that includes the given point, or null if outside the nodes
    selectNode: function(point) {
	    for (var n in this.nodes) {
		    if (this.nodes[n].containsPoint(point)) {
			    return this.nodes[n];
		    }
	    }
	    return null;
    }
};

/*
 * Node
 */
Graph.Node = function(id, node){
	if (node) {
		for (var attrib in node) {
			this[attrib] = node[attrib];
		}
	}
    this.id = id;
    this.edges = [];
    this.hide = function() {
        this.hidden = true;
        this.shape && this.shape.hide(); /* FIXME this is representation specific code and should be elsewhere */
        for(i in this.edges)
            (this.edges[i].source.id == id || this.edges[i].target == id) && this.edges[i].hide && this.edges[i].hide();
    };
    this.show = function() {
        this.hidden = false;
        this.shape && this.shape.show();
        for(i in this.edges)
            (this.edges[i].source.id == id || this.edges[i].target == id) && this.edges[i].show && this.edges[i].show();
    };
    this.radius = 40; // used for collision only atm
};
Graph.Node.prototype = {
	// point inside the node?
	containsPoint: function(point) {
		if (!this.point) return false;
		var dx = point.x - this.point[0];
		var dy = point.y - this.point[1];
		if ( dx * dx + dy * dy < this.radius * this.radius ) {
			return true;
		}
		return false;
	}
};

/*
 * Renderer base class
 */
Graph.Renderer = {};

/*
 * Renderer implementation using RaphaelJS
 */
Graph.Renderer.Raphael = function(element, graph, width, height) {
    this.width = width || 400;
    this.height = height || 400;
    var selfRef = this;
    this.r = Raphael(element, this.width, this.height);
    this.radius = 40; /* max dimension of a node */
    this.graph = graph;
    this.mouse_in = false;
    this.selectedNode = null;
    this.selectedLabel = null;
    this.tmpText = "";

    /* TODO default node rendering function */
    if(!this.graph.render) {
        this.graph.render = function() {
            return;
        }
    }
    
    /*
     * Dragging
     */
    this.isDrag = false;
    this.mouseDownOnNode = function (e) {
    	if (this.type === "text") return; // can't drag text
        this.dx = e.clientX;
        this.dy = e.clientY;
        selfRef.isDrag = this;
        this.set && this.set.animate({"fill-opacity": .1}, 200) && this.set.toFront();
        e.preventDefault && e.preventDefault();
    };
    this.dblclickOnNode = function (e) {
	    //console.log(this[0]);
	    this.tmpText = "";
	    selfRef.selectedLabel = this[0].firstChild;
	    selfRef.selectedLabel.textContent = "|"; // caret
    }
    this.acceptTextInput = function() {
	    if (selfRef.selectedLabel) {
		    if (selfRef.selectedNode) {
		    	// valid text && not existing node?
		    	var newId = selfRef.tmpText.replace(" ", "_");
			    if (newId !== "" && !selfRef.graph.nodes[newId]) {
			    	var oldId = selfRef.selectedNode.id;
			    	selfRef.selectedNode.id = newId;
			    	selfRef.selectedNode.shape[0][0].id = newId;
			    	// change the reference
				    selfRef.graph.nodes[newId] = selfRef.selectedNode;
				    // remove old reference
				    selfRef.graph.nodes[oldId] = null;
				    delete selfRef.graph.nodes[oldId];
			    }
			    selfRef.selectedLabel.textContent = selfRef.selectedNode.id;
		    } else {
			    console.log("Modifying which label???");
			}
			selfRef.selectedLabel = null;
			selfRef.tmpText = "";
	    }
    }
    
    var d = document.getElementById(element);
    d.onmousemove = function (e) {
        e = e || window.event;
        if (selfRef.isDrag) {
            var bBox = selfRef.isDrag.set.getBBox();
            // TODO round the coordinates here (eg. for proper image representation)
            var newX = e.clientX - selfRef.isDrag.dx + (bBox.x + bBox.width / 2);
            var newY = e.clientY - selfRef.isDrag.dy + (bBox.y + bBox.height / 2);
            /* prevent shapes from being dragged out of the canvas */
            var clientX = e.clientX - (newX < 20 ? newX - 20 : newX > selfRef.width - 20 ? newX - selfRef.width + 20 : 0);
            var clientY = e.clientY - (newY < 20 ? newY - 20 : newY > selfRef.height - 20 ? newY - selfRef.height + 20 : 0);
            selfRef.isDrag.set.translate(clientX - Math.round(selfRef.isDrag.dx), clientY - Math.round(selfRef.isDrag.dy));
            //            console.log(clientX - Math.round(selfRef.isDrag.dx), clientY - Math.round(selfRef.isDrag.dy));
            for (var i in selfRef.graph.edges) {
                selfRef.graph.edges[i].connection && selfRef.graph.edges[i].connection.draw();
            }
            //selfRef.r.safari();
            selfRef.isDrag.dx = clientX;
            selfRef.isDrag.dy = clientY;
        }
    };
    d.onmouseup = function () {
        if (selfRef.isDrag) {
        	//console.log(selfRef.isDrag);
        	selfRef.isDrag.set.animate({"fill-opacity": .6}, 500);
        	// copy the new node position back to the graph
        	if (selfRef.isDrag.type !== "text") {
	        	var point = {x: selfRef.isDrag.matrix.e, y: selfRef.isDrag.matrix.f};
	        	var layoutPoint = selfRef.pointToLayout(point);
	        	var nodeId = selfRef.isDrag.node.id;
	        	if (selfRef.graph.nodes[nodeId]) {  	
		        	selfRef.graph.nodes[nodeId].layoutPosX = layoutPoint.x;
		        	selfRef.graph.nodes[nodeId].layoutPosY = layoutPoint.y;
		        } else {
			        console.log("Unexisting node! "+selfRef.isDrag.node.id);
		        }
	        }
        }
        selfRef.isDrag = false;
    };
    d.onmousedown = function(e) {
	    var mouse = window.crossBrowserRelativeMousePos(e);
	    var selected = selfRef.graph.selectNode(mouse);
	    if (selected) {
	    	if (selected !== selfRef.selectedNode) {
	    		if (selfRef.selectedNode && selfRef.selectedNode.color) {
				    // return to its original color after deselection
				    selfRef.selectedNode.shape[0][0].setAttribute("stroke", selfRef.selectedNode.color);
				    selfRef.selectedNode.shape[0][0].setAttribute("fill", selfRef.selectedNode.color);
				}
			    // remember node color
			    selected.color = selected.shape[0][0].getAttribute("stroke");
			    // set some fancy color
			    selected.shape[0][0].setAttribute("stroke", "red");
			    selected.shape[0][0].setAttribute("fill", "white");
			    selfRef.selectedNode = selected;
			}
	    } else { // if not pressing Shift
		    if (selfRef.selectedNode && selfRef.selectedNode.color) {
			    // return to its original color after deselection
			    selfRef.selectedNode.shape[0][0].setAttribute("stroke", selfRef.selectedNode.color);
			    selfRef.selectedNode.shape[0][0].setAttribute("fill", selfRef.selectedNode.color);
		    }
		    selfRef.selectedNode = null;
	    }
	    /*
	    movingObject = false;
	    originalClick = mouse;
	
	    if (selectedObject != null) {
	      if (shift && selectedObject instanceof Node) {
	        currentLink = new SelfLink(selectedObject, mouse);
	      } else {
	        movingObject = true;
	        deltaMouseX = deltaMouseY = 0;
	        if (selectedObject.setMouseStart) {
	          selectedObject.setMouseStart(mouse.x, mouse.y);
	        }
	      }
	      resetCaret();
	    } else if (shift) {
	      currentLink = new TemporaryLink(mouse, mouse);
	    }
	
	    draw();	
	    */
    };
    d.ondblclick = function(e) {
	    var mouse = window.crossBrowserRelativeMousePos(e);
	    var layoutPoint = selfRef.pointToLayout(mouse);
	    //console.log(mouse);
	    if (selfRef.selectedNode) return; // handled in dblclickOnNode
	    // create a new node
	    var nodeNumber = 1;
	    while (selfRef.graph.nodes["N"+nodeNumber]) nodeNumber++;
	    selfRef.graph.addNode("N"+nodeNumber, {layoutPosX: layoutPoint.x, layoutPosY: layoutPoint.y});
	    selfRef.draw();
    };
    this.draw();
};
Graph.Renderer.Raphael.prototype = {
    translate: function(point) {
        return [
            (point[0] - this.graph.layoutMinX) * this.factorX + this.radius,
            (point[1] - this.graph.layoutMinY) * this.factorY + this.radius
        ];
    },
    
    // convert canvas absolute coordinates to layout relative coordinates
    pointToLayout: function(point) {
	    var p = {};
	    p.x = this.graph.layoutMinX + (point.x - this.radius) / this.factorX;
	    p.y = this.graph.layoutMinY + (point.y - this.radius) / this.factorY;
	    return p;
    },

    rotate: function(point, length, angle) {
        var dx = length * Math.cos(angle);
        var dy = length * Math.sin(angle);
        return [point[0]+dx, point[1]+dy];
    },

    draw: function() {
        this.factorX = (this.width - 2 * this.radius) / (this.graph.layoutMaxX - this.graph.layoutMinX);
        this.factorY = (this.height - 2 * this.radius) / (this.graph.layoutMaxY - this.graph.layoutMinY);
        for (i in this.graph.nodes) {
            this.drawNode(this.graph.nodes[i]);
        }
        for (var i = 0; i < this.graph.edges.length; i++) {
            this.drawEdge(this.graph.edges[i]);
        }
    },

    drawNode: function(node) {
        var point = this.translate([node.layoutPosX, node.layoutPosY]);
        node.point = point;

        /* if node has already been drawn, move the nodes */
        if(node.shape) {
            var oBBox = node.shape.getBBox();
            var opoint = { x: oBBox.x + oBBox.width / 2, y: oBBox.y + oBBox.height / 2};
            node.shape.translate(Math.round(point[0] - opoint.x), Math.round(point[1] - opoint.y));
            this.r.safari();
            return node;
        }/* else, draw new nodes */

        var shape;

        /* if a node renderer function is provided by the user, then use it 
           or the default render function instead */
        if(!node.render) {
            node.render = function(r, node) {
                /* the default node drawing */
                var color = Raphael.getColor();
                var ellipse = r.ellipse(0, 0, 30, 20).attr({fill: color, stroke: color, "stroke-width": 2});
                /* set DOM node ID */
                ellipse.node.id = node.label || node.id;
                shape = r.set().
                    push(ellipse).
                    push(r.text(0, 30, node.label || node.id));
                return shape;
            }
        }
        /* or check for an ajax representation of the nodes */
        if(node.shapes) {
            // TODO ajax representation evaluation
        }

        shape = node.render(this.r, node).hide();

        shape.attr({"fill-opacity": .6});
        /* re-reference to the node an element belongs to, needed for dragging all elements of a node */
        shape.items.forEach(function(item){ item.set = shape; item.node.style.cursor = "move"; });
        shape.mousedown(this.mouseDownOnNode);
        shape.dblclick(this.dblclickOnNode);

        var box = shape.getBBox();
        shape.translate(Math.round(point[0]-(box.x+box.width/2)),Math.round(point[1]-(box.y+box.height/2)))
        //console.log(box,point);
        node.hidden || shape.show();
        node.shape = shape;
    },
    drawEdge: function(edge) {
        /* if this edge already exists the other way around and is undirected */
        if(edge.backedge)
            return;
        if(edge.source.hidden || edge.target.hidden) {
            edge.connection && edge.connection.fg.hide() | edge.connection.bg && edge.connection.bg.hide();
            return;
        }
        /* if edge already has been drawn, only refresh the edge */
        if(!edge.connection) {
            edge.style && edge.style.callback && edge.style.callback(edge); // TODO move this somewhere else
            edge.connection = this.r.connection(edge.source.shape, edge.target.shape, edge.style);
            return;
        }
        //FIXME showing doesn't work well
        edge.connection.fg.show();
        edge.connection.bg && edge.connection.bg.show();
        edge.connection.draw();
    }
};
Graph.Layout = {};
Graph.Layout.Spring = function(graph) {
    this.graph = graph;
    this.iterations = 500;
    this.maxRepulsiveForceDistance = 6;
    this.k = 2;
    this.c = 0.01;
    this.maxVertexMovement = 0.5;
    this.layout();
};
Graph.Layout.Spring.prototype = {
    layout: function() {
        this.layoutPrepare();
        for (var i = 0; i < this.iterations; i++) {
            this.layoutIteration();
        }
        this.layoutCalcBounds();
    },
    
    layoutPrepare: function() {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
            node.layoutForceX = 0;
            node.layoutForceY = 0;
        }
        
    },
    
    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;
            
            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;
        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    },
    
    layoutIteration: function() {
        // Forces on nodes due to node-node repulsions

        var prev = new Array();
        for(var c in this.graph.nodes) {
            var node1 = this.graph.nodes[c];
            for (var d in prev) {
                var node2 = this.graph.nodes[prev[d]];
                this.layoutRepulsive(node1, node2);
                
            }
            prev.push(c);
        }
        
        // Forces on nodes due to edge attractions
        for (var i = 0; i < this.graph.edges.length; i++) {
            var edge = this.graph.edges[i];
            this.layoutAttractive(edge);             
        }
        
        // Move by the given force
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            var xmove = this.c * node.layoutForceX;
            var ymove = this.c * node.layoutForceY;

            var max = this.maxVertexMovement;
            if(xmove > max) xmove = max;
            if(xmove < -max) xmove = -max;
            if(ymove > max) ymove = max;
            if(ymove < -max) ymove = -max;
            
            node.layoutPosX += xmove;
            node.layoutPosY += ymove;
            node.layoutForceX = 0;
            node.layoutForceY = 0;
        }
    },

    layoutRepulsive: function(node1, node2) {
        if (typeof node1 == 'undefined' || typeof node2 == 'undefined')
            return;
        var dx = node2.layoutPosX - node1.layoutPosX;
        var dy = node2.layoutPosY - node1.layoutPosY;
        var d2 = dx * dx + dy * dy;
        if(d2 < 0.01) {
            dx = 0.1 * Math.random() + 0.1;
            dy = 0.1 * Math.random() + 0.1;
            var d2 = dx * dx + dy * dy;
        }
        var d = Math.sqrt(d2);
        if(d < this.maxRepulsiveForceDistance) {
            var repulsiveForce = this.k * this.k / d;
            node2.layoutForceX += repulsiveForce * dx / d;
            node2.layoutForceY += repulsiveForce * dy / d;
            node1.layoutForceX -= repulsiveForce * dx / d;
            node1.layoutForceY -= repulsiveForce * dy / d;
        }
    },

    layoutAttractive: function(edge) {
        var node1 = edge.source;
        var node2 = edge.target;
        
        var dx = node2.layoutPosX - node1.layoutPosX;
        var dy = node2.layoutPosY - node1.layoutPosY;
        var d2 = dx * dx + dy * dy;
        if(d2 < 0.01) {
            dx = 0.1 * Math.random() + 0.1;
            dy = 0.1 * Math.random() + 0.1;
            var d2 = dx * dx + dy * dy;
        }
        var d = Math.sqrt(d2);
        if(d > this.maxRepulsiveForceDistance) {
            d = this.maxRepulsiveForceDistance;
            d2 = d * d;
        }
        var attractiveForce = (d2 - this.k * this.k) / this.k;
        if(edge.attraction == undefined) edge.attraction = 1;
        attractiveForce *= Math.log(edge.attraction) * 0.5 + 1;
        
        node2.layoutForceX -= attractiveForce * dx / d;
        node2.layoutForceY -= attractiveForce * dy / d;
        node1.layoutForceX += attractiveForce * dx / d;
        node1.layoutForceY += attractiveForce * dy / d;
    }
};

Graph.Layout.Ordered = function(graph, order) {
    this.graph = graph;
    this.order = order;
    this.layout();
};
Graph.Layout.Ordered.prototype = {
    layout: function() {
        this.layoutPrepare();
        this.layoutCalcBounds();
    },
    
    layoutPrepare: function(order) {
        for (i in this.graph.nodes) {
            var node = this.graph.nodes[i];
            node.layoutPosX = 0;
            node.layoutPosY = 0;
        }
            var counter = 0;
            for (i in this.order) {
                var node = this.order[i];
                node.layoutPosX = counter;
                node.layoutPosY = Math.random();
                counter++;
            }
    },
    
    layoutCalcBounds: function() {
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;

        for (i in this.graph.nodes) {
            var x = this.graph.nodes[i].layoutPosX;
            var y = this.graph.nodes[i].layoutPosY;
            
            if(x > maxx) maxx = x;
            if(x < minx) minx = x;
            if(y > maxy) maxy = y;
            if(y < miny) miny = y;
        }

        this.graph.layoutMinX = minx;
        this.graph.layoutMaxX = maxx;

        this.graph.layoutMinY = miny;
        this.graph.layoutMaxY = maxy;
    }
};

/*
 * usefull JavaScript extensions, 
 */

function log(a) {console.log&&console.log(a);}

/*
 * Raphael Tooltip Plugin
 * - attaches an element as a tooltip to another element
 *
 * Usage example, adding a rectangle as a tooltip to a circle:
 *
 *      paper.circle(100,100,10).tooltip(paper.rect(0,0,20,30));
 *
 * If you want to use more shapes, you'll have to put them into a set.
 *
 */
Raphael.el.tooltip = function (tp) {
    this.tp = tp;
    this.tp.o = {x: 0, y: 0};
    this.tp.hide();
    this.hover(
        function(event){ 
            this.mousemove(function(event){ 
                this.tp.translate(event.clientX - 
                                  this.tp.o.x,event.clientY - this.tp.o.y);
                this.tp.o = {x: event.clientX, y: event.clientY};
            });
            this.tp.show().toFront();
        }, 
        function(event){
            this.tp.hide();
            this.unmousemove();
        });
    return this;
};

/* For IE */
if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}

// --------------------
// Key presses
// --------------------
document.onkeydown = function(e) {
  var key = window.crossBrowserKey(e);

  if (key == 16) {
    window.shiftPressed = true;
  } else if (!window.canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (window.stateMachine && window.stateMachine.renderer) {
	if (window.stateMachine.renderer.selectedLabel != null) {
	    if (key == 8 && window.stateMachine.renderer.tmpText !== "") { // backspace key
		    window.stateMachine.renderer.tmpText = window.stateMachine.renderer.tmpText.substr(0, window.stateMachine.renderer.tmpText.length - 1);
		    window.stateMachine.renderer.selectedLabel.textContent = window.stateMachine.renderer.tmpText + "|"; // +caret
		}
    } else {
    /*
    if (key == 8 || key == 46) { // delete key
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] == selectedObject) {
          nodes.splice(i--, 1);
        }
      }
      for (var i = 0; i < links.length; i++) {
        if (links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject) {
          links.splice(i--, 1);
        }
      }
      selectedObject = null;
      draw();
      */
    }
  
  }

  // backspace is a shortcut for the back button, but do NOT want to change pages
  if (key == 8) return false;
};

document.onkeyup = function(e) {
  var key = window.crossBrowserKey(e);

  if (key == 16) {
    window.shiftPressed = false;
  }
};

document.onkeypress = function(e) {
  // don't read keystrokes when other things have focus
  var key = window.crossBrowserKey(e);
  if (!window.canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (key >= 0x20 && key <= 0x7E && !e.metaKey && !e.altKey && !e.ctrlKey 
  	&& window.stateMachine && window.stateMachine.renderer
  	&& window.stateMachine.renderer.selectedLabel != null) {
    window.stateMachine.renderer.tmpText += String.fromCharCode(key);
    window.stateMachine.renderer.selectedLabel.textContent = window.stateMachine.renderer.tmpText + "|"; // +caret
    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (key == 13) { // accept input
  	window.stateMachine.renderer.acceptTextInput();
  } else if (key == 8) {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
};
