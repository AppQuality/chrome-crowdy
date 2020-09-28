"use strict";

tryInject(contentJS);

function contentJS() {
	// FUNCTIONS

	function isClickable(element) {
		return (getComputedStyle(element).cursor == "pointer" || element.getAttribute("role") == "button" || element.href != undefined || element.tagName == "button");
	}

	// BODY LISTENER FOR CLICKS 
	// The click is caught during the 'capturing' phase, so it gets stored beofre the click itself gets executed.

	document.getElementsByTagName("body")[0].addEventListener("click", function (event) {
		if (!isClickable(event.target))
			return;

		let data = { 
			"url": window.location.href,
			"id_obj": event.target.id,
			"class_obj": event.target.className,
			"position_x": event.clientX,
			"position_y": event.clientY
		};

		chrome.runtime.sendMessage({ array:ARR_EVENTS, 'type':CLICK, 'data':data, 'domain':window.location.href });
	}, true);
}