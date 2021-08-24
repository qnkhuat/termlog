# TConsole
Bring browser console to your terminal

### What it does
TConsole send the browser console log to your terminal.

It also comes with a __nodejs__ REPL so you can do some basic draft code

### When to use it
While you developing your front-end app and you have to switch back and forth between IDE and browser.

# How to use it?
There are two ways and it depends on your preferences

## Recommended way
1. Install the `tconsole` binary : `npm install --save-dev tconsole` ( you also can install globally with `npm install -g tconsole` )
2. Go to the entry file of your project (I.e: app.jsx for React.js or main.js for vue.js)
3. Insert these two lines:
`
import tconsole from "t-console";
tconsole();
`
4. You should now see your console log stream to this terminal

__Note__: with this approach you might want to remove two lines above in production. 

By default tconsole will __not__ run if it detects production mode using `NODE_ENV`, but you shouldn't rely on that.

## I don't want to add dependencies to my project
1. Install the `tconsole` binary : `npm install -g tconsole`
2. Start the server `tconsole`
3. Go to your browser and open the console window
4. Copy all code except for the last export line from [index.js](index.js) file to console
5. Enter `tconsole()` in side console
6. You should now see your console log stream to this terminal


__Note__: with this approach you have to do all steps 3-6 every-time you refresh your browser tab.

## Advanced options

## Future release
- [ ] Install using `<script/>` tag
- [ ] (Maybe) An extension to start tconsole on browser so we don't have to install dependencies
- [ ] (If possible) Browser console REPL instead of nodejs REPL
