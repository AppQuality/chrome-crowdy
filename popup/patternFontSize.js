// Just change the font size of the JSON pattern. Inline scripts aren't allowed in extensions, so you need to define a new file and use the src attribute.

window.onload = function () {
	document.getElementById("json").contentWindow.document.getElementsByTagName("body")[0].style.fontSize = "100%";
}