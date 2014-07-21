/* yaml2cpp.js
 * By David Gavilan, http://endavid.com
 * License: MIT https://raw.github.com/endavid/StateMachine/master/README.md
 */

/** The YAML file needs to be parsed outside */
function StateMachineCppExporter(json) {
	this.stateMachine = json;
	// Exports header file
	this.createHeader = function(stateMachineName) {
		//console.log(this.stateMachine);
		var output = "// File autogenerated with yaml2cpp.js\n\n";
		var headerGuard = "STATEMACHINE_"+stateMachineName.toUpperCase()+"_H_";
		output += "#ifndef "+headerGuard+"\n";
		output += "#define "+headerGuard+"\n";
		output += "#include \"core/StateMachine.h\"\n\n";
		output += "class "+stateMachineName+" : public vd::core::StateMachine&lt;"+stateMachineName+"&gt; {\n";
		output += "public:\n"
		output += "\t"+stateMachineName+"();\n\n";
		output += "protected:\n";
		output += "\tvirtual void CommonUpdate(const float time_ms);\n\n";
		output += "private:\n";
		// loop through the states
		for (var n in this.stateMachine) { /* loop through the nodes */
			output += "\t void State"+n+"(const float time_ms);\n";
		}
		output += "};\n"
		output += "#endif"
		
		return output;
	};
	// Exports cpp file
	this.createCpp = function(stateMachineName) {
		// assume the first key is the first state
		var initState = Object.keys(this.stateMachine)[0];
		var output = "// File autogenerated with yaml2cpp.js\n\n";
		output += "#include \""+stateMachineName+".h\"\n\n";
		output += stateMachineName+"::"+stateMachineName+"()\n";
		output += ": Super(&"+stateMachineName+"::State"+initState+")\n";
		output += "{\n\n}\n\n";
		output += "void "+stateMachineName+"::CommonUpdate(const float time_ms)\n";
		output += "{\n\n}\n\n";
		output += "// ---------------------------------------------------------\n"
		output += "// States\n"
		output += "// ---------------------------------------------------------\n"
		output += "#pragma mark States\n\n"
		// loop through the states
		for (var n in this.stateMachine) { /* loop through the nodes */
			output += "void "+stateMachineName+"::State"+n+"(const float time_ms)\n{\n";
			// loop through the links
			for (var targetNode in json[n]) {
			    if (targetNode === "attributes") continue; // not a State
			    var jumpTo = "\tSwitchTo(&"+stateMachineName+"::State"+targetNode+");\n";
			    // condition ("when" exists?)
			    if (json[n][targetNode] && json[n][targetNode].when) {
				    output += "\tif (false /* "+json[n][targetNode].when+" */) {\n";
				    output += "\t"+jumpTo;
				    output += "\t}\n";
			    } else {
				    output += jumpTo;
			    }
		    }
			output += "}\n";
		}
		return output;
	}
}