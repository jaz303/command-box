module.exports = CommandBox;

var bind = require('dom-bind').bind;

//
// utilities

function defaultFormatter(object) {
    throw new Error("no object formatter specified");
}

function defaultEvaluator(command, console) {
    console.notReady();
    setTimeout(function() {
        console.print('evaluate: `' + command + '`');
        console.newCommand(true);
        console.focus();
    }, 200);
}

var defaultPrompt = { text: '> ' };

function isElement(x) {
    return x && x.nodeType === 1;
}

//
//

function CommandBox(el, opts) {
    
    this.root = el;

    opts = opts || {};
    
    this._format    = opts.format || defaultFormatter;
    this._evaluate  = opts.evaluate || defaultEvaluator;
    this._prompt    = opts.prompt || defaultPrompt;
    this._echo      = ('echo' in opts) ? (!!opts.echo) : true;

    this._history = [];
    this._historyIx = null;
    this._historyStash = null;
    
    this._buildStructure();

    this.notReady();
    this.newCommand();

}

//
// Public Interface

CommandBox.prototype.print = function(thing, className) {
    if (isElement(thing) || (typeof thing === 'string' && thing[0] === '<')) {
        this.printHTML(thing);
    } else if (typeof text === 'object') {
        this.printObject(thing);
    } else {
        this.printText(thing, className)
    }
}

CommandBox.prototype.printText = function(text, className) {
    this._appendOutputText(text, className);
}

CommandBox.prototype.printError = function(text) {
    this._appendOutputText(text, 'error');
}

CommandBox.prototype.printSuccess = function(text) {
    this._appendOutputText(text, 'success');
}

CommandBox.prototype.printHTML = function(html) {
    var el = this.document.createElement('div');
    if (isElement(html)) {
        el.appendChild(html);
    } else {
        el.innerHTML = html;
    }
    this._appendOutputElement(el);
}

CommandBox.prototype.printObject = function(obj) {
    var formatted = this._format(obj);
    if (formatted !== false)
        this.printHTML(formatted);
}

CommandBox.prototype.setFormatter = function(formatter) {
    this._format = formatter;
}

/**
 * Set the evaluator function.
 * The evaluator function will be passed 2 arguments - the command to be
 * evaluated, and the CommandBox object.
 *
 * @param evaluator
 */
CommandBox.prototype.setEvaluator = function(evaluator) {
    this._evaluate = evaluator;
}

/**
 * Prompt can either be:
 * a string representing the prompt text
 * an object with any/all of the keys: text, color, className
 * a function returning any of the above
 *
 * @param prompt
 */
CommandBox.prototype.setPrompt = function(prompt) {
    if (typeof prompt == 'string')
        prompt = { text: prompt };
        
    this._prompt = prompt;
}

CommandBox.prototype.echoOn = function() {
    this.setEcho(true);
}

CommandBox.prototype.echoOff = function() {
    this.setEcho(false);
}

CommandBox.prototype.setEcho = function(echo) {
    this._echo = !!echo;
}

// terminal is not ready for input; command line is hidden.
CommandBox.prototype.notReady = function() {
    // this._command.setAttribute('disabled', 'disabled');
    this._input.style.display = 'none';
}

// terminal is ready for input; command line is shown.
CommandBox.prototype.ready = function() {
    // this._command.removeAttribute('disabled');
    this._input.style.display = '-webkit-box';
}

CommandBox.prototype.focus = function() {
    this._command.focus();
}

/**
 * Clear's the user's current command.
 * Also cancels any active history navigation.
 */
CommandBox.prototype.clearCommand = function() {
    this._command.value = '';
    this._historyIx = null;
}

// prepare for a new command - clear current input, generate
// a new prompt and scroll to the bottom. set `makeReady` to
// true to make the terminal ready at the same time.
CommandBox.prototype.newCommand = function(makeReady) {

    this.clearCommand();
    
    var prompt = this._optionsForNewPrompt();
    this._inputPrompt.textContent = prompt.text;
    
    if ('color' in prompt) {
        this._inputPrompt.style.color = prompt.color;
    }

    this._inputPrompt.className = 'prompt';
    if (prompt.className) {
        this._inputPrompt.className += ' ' + prompt.className;
    }
    
    // TODO: not sure if this belongs here
    this._scrollToBottom();

    if (makeReady) {
        this.ready();
    }

}

//
// Private API

CommandBox.prototype._appendOutputText = function(text, className) {

    text = ('' + text);

    // TODO: text should be appended using a <pre> so we don't need to do
    // any of this replacement crap
    var el = document.createElement('div');
    el.className = 'text-line ' + (className || '');
    el.innerHTML = text.replace(/\n/g, "<br/>")
                       .replace(/ /g,  "&nbsp;");
    
    this._appendOutputElement(el);

}

CommandBox.prototype._appendOutputElement = function(el) {
    el.className += ' output-item';
    this._output.appendChild(el);
    this._scrollToBottom();
}

CommandBox.prototype._getCommand = function() {
    return this._command.value;
}

CommandBox.prototype._scrollToBottom = function() {
    this.root.scrollTop = this.root.scrollHeight;
}

CommandBox.prototype._optionsForNewPrompt = function() {
    var prompt = this._prompt;
    if (typeof prompt === 'function') prompt = prompt();
    return prompt || defaultPrompt;
}

CommandBox.prototype._bell = function() {
    // TODO: beep or something
}

CommandBox.prototype._handleEnter = function() {
    
    if (this._echo) {
        this._echoCurrentCommand();
    }
    
    var command = this._getCommand();
    if (this._evaluate) {
        this.clearCommand();
        if (this._history.length == 0 || command != this._history[this._history.length - 1]) {
            this._history.push(command);
        }
        this._evaluate(command, this);
    } else {
        this.newCommand();
    }

}

CommandBox.prototype._handleClear = function() {
    this.clearCommand();
}

CommandBox.prototype._handleHistoryNav = function(dir) {
    
    if (this._history.length == 0) {
        return;
    }
    
    var cmd = null;
    
    if (dir == 'prev') {
        if (this._historyIx === null) {
            this._historyStash = this._command.value || '';
            this._historyIx = this._history.length - 1;
        } else {
            this._historyIx--;
            if (this._historyIx < 0) {
                this._historyIx = 0;
            }
        }
    } else {
        if (this._historyIx === null) {
            return;
        }
        this._historyIx++;
        if (this._historyIx == this._history.length) {
            cmd = this._historyStash;
            this._historyIx = null;
        }
    }
    
    if (cmd === null) {
        cmd = this._history[this._historyIx];
    }
    
    this._command.value = cmd;
    
}

CommandBox.prototype._handleAutocomplete = function() {
    console.log("AUTO-COMPLETE");
}

CommandBox.prototype._echoCurrentCommand = function() {
    
    var line = document.createElement('div');
    line.className = 'input-line';

    var prompt = this._inputPrompt.cloneNode(true);
    
    var cmd = document.createElement('span');
    cmd.className = 'command';
    cmd.textContent = this._getCommand();
    
    line.appendChild(prompt);
    line.appendChild(cmd);
    
    this._appendOutputElement(line);
}

//
// Internals

CommandBox.prototype._buildStructure = function() {

    var self = this;

    if (!this.root.hasAttribute('tabindex')) {
        this.root.setAttribute('tabindex', 0);
    }

    this._output      = document.createElement('output');
    this._input       = document.createElement('div');
    this._inputPrompt = document.createElement('span');
    this._cmdWrapper  = document.createElement('span');
    this._command     = document.createElement('input');
    
    this._input.className       = 'input-line';
    this._cmdWrapper.className  = 'command-wrapper';
    this._command.type          = 'text';
    this._command.className     = 'command';
    
    this._cmdWrapper.appendChild(this._command);
    this._input.appendChild(this._inputPrompt);
    this._input.appendChild(this._cmdWrapper);
    this.root.appendChild(this._output);
    this.root.appendChild(this._input);

    bind(this.root, 'focus', function() {
        self._command.focus();
    });

    bind(this._command, 'keydown', function(evt) {
        switch (evt.which) {
            case 8:  if (self._command.value.length == 0) self._bell();     break;
            case 13: evt.preventDefault(); self._handleEnter();             break;
            case 27: evt.preventDefault(); self._handleClear();             break;
            case 38: evt.preventDefault(); self._handleHistoryNav('prev');  break;
            case 40: evt.preventDefault(); self._handleHistoryNav('next');  break;
            case 9:  evt.preventDefault(); self._handleAutocomplete();      break;
        }
    });

}