# command-box

A console widget. This differs from [echo-chamber](http://github.com/jaz303/echo-chamber) by using an `<input>` tag instead of handling user input manually.

## Usage

```javascript
var CommandBox = require('command-box');

// #console should be a div element
var widget = new CommandBox(document.querySelector('#console'), {
    
    // example of an async evaluator
    evaluate: function(command, console) {
        console.notReady(); // hide input box

        // now evaluate the submitted command
        doWork(function(result) {

            // print output to console
            console.print(result);

            // and set up the console for the next command
            console.newCommand(true);
            console.focus();
        
        });

    },

    prompt: function(console) {
        return { text: '> ' }
    },

    // submitted commands should be echoed to the output
    echo: true
});

// tell the widget to prepare itself for new input by clearing any existing
// input and setting a new prompt. the true paramater indicates that the console
// should also be 'made ready' meaning that the input box will be revealed.
widget.newCommand(true);
widget.focus();
```

Default styles are in `default.css`; you can substitute the base `command-box` class for whatever you wish.

## Copyright &amp; License

&copy; 2014 Jason Frame [ [@jaz303](http://twitter.com/jaz303) / [jason@onehackoranother.com](mailto:jason@onehackoranother.com) ]

Released under the ISC license.