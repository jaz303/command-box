var CommandBox = require('..');

window.init = function() {

	var root = document.querySelector('#console');

	var box = new CommandBox(root, {

	});

	box.newCommand(true);

}