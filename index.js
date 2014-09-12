module.exports = CommandBox;

var bind = require('dom-bind');

function CommandBox(el) {
    
    this.root = el;

    this._history = [];
    this._historyIx = null;

    this._buildStructure();

}

CommandBox.prototype._buildStructure = function() {

    var self = this;
    
    var root        = document.createElement('div'),
        output      = document.createElement('output'),
        line        = document.createElement('div'),
        prompt      = document.createElement('span'),
        cmdWrapper  = document.createElement('span'),
        cmd         = document.createElement('input');
            
    root.className        = 'command-box';
    line.className        = 'input-line';
    cmdWrapper.className  = 'command-wrapper';
    cmd.type              = 'text';
    cmd.className         = 'command';
    
    cmdWrapper.appendChild(cmd);
    line.appendChild(prompt);
    line.appendChild(cmdWrapper);
    root.appendChild(output);
    root.appendChild(line);
    
    root.onclick = function() { cmd.focus(); }
    cmd.onpaste = function(evt) { self._handlePaste(evt); evt.preventDefault(); };
    cmd.onkeydown = function(evt) {
        switch (evt.which) {
            case 8:  if (self._command.value.length == 0) self._bell();     break;
            case 13: evt.preventDefault(); self._handleEnter();             break;
            case 27: evt.preventDefault(); self._handleClear();             break;
            case 38: evt.preventDefault(); self._handleHistoryNav('prev');  break;
            case 40: evt.preventDefault(); self._handleHistoryNav('next');  break;
            case 9:  evt.preventDefault(); self._handleAutocomplete();      break;
        }
    };
    
    this._root    = root;
    this._output  = output;
    this._input   = line;
    this._prompt  = prompt;
    this._command = cmd;

}