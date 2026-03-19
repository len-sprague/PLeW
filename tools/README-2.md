simple/ 
Scripts for running local-visualizer.html on 
Windows (.bat)
Mac/Linux (.sh)

These will open terminal but not close it automatically.
Python3 is used to open a local server for internet access,
so that embedded Youtube videos do not get blocked by YT's
HTTP requirement (thus throwing Error 153 if wholy local).

heartbeat/
Same as above, but with a python script that runs too,
checking if the local-visualizer.html is still open every
few seconds. Closes the terminal automatically if not.
 
