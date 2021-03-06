StateMachine
=============

* Simple StateMachine in C++ using member function pointers, with code auto-generation from YAML

Web interface
--------------
* You can edit your state machine from the web interface, and export the code to C++ from there.
* Try it out: http://endavid.com/StateMachine/

Script Usage
-------------
* Create a YAML file with the description of your state machine. Eg.

```
Init:
  A: {when: "A is selected"}
  B: {when: "B is selected"}

A:
 End:

B:
 A: {when: "finished A"}

End:

```

* Run the ruby script to generate .h and .cpp skeleton files:

```bash
    ruby bin/yaml2cpp.rb MyStateMachine.yaml
```

* Check the samples folder for some examples.
* Once you get the skeleton, you have to directly write the logic inside the .cpp file, of course.

Common update
-------------
* The web interface supports a special type of node labelled "." that applies to the CommonUpdate. 
* In this manner, you can change state from the common update and avoid typing unnecessary state changes and having hundreds of lines from everywhere to everywhere in the diagram.
* In the example below, we stay in Init state until A or B is pressed. Once in A or B, we can switch to B or A again.

```
Init:

A:

B:

.:
 A: {when: "A is selected"}
 B: {when: "B is selected"}
```



Troubleshooting
---------------
* The initial state is set up to be the first key of the hash created from the YAML file. However the hash may not be sorted. 
* Use Ruby 1.9.x. Previous version of Ruby does not preserve the order of Hash keys, but 1.9 does.

Accompanying software licenses
-------------------------------

### Dracula Graph Library ###
* Copyright &copy; 2010 Philipp Strathausen. MIT License
* http://www.graphdracula.net/

### js-yaml ###
* Copyright &copy; 2011, 2013 Vitaly Puzrin. MIT License
* https://github.com/nodeca/js-yaml

### FileSaver.js ###
* Copyright &copy; 2011 [Eli Grey][1]. MIT License
* https://github.com/eligrey/FileSaver.js

### Twitter Bootstrap 3 ###
* Copyright 2012 Twitter, Inc under the Apache 2.0 license.
* http://getbootstrap.com/

### Prettify ###
* Copyright 2013 Google, Inc under the Apache 2.0 license.
* https://code.google.com/p/google-code-prettify/


License
-------
MIT License

Copyright (C) 2013 David Gavilan Ruiz
 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Author information
===================
* http://endavid.com
[![endorse](https://api.coderwall.com/endavid/endorsecount.png)](https://coderwall.com/endavid)

