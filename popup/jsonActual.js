"use-strict";

var iframe = document.getElementById("json");

// Options buttons are created dynamically
OPTIONS.forEach( opt => {
	if (opt != EXTENSIONS)
		createButton(opt,optionListener,"optionButtons");
});
ARRAYS.forEach( arr => { createButton(arr,arrayListener,"arrayButtons"); });

// ID of buttons is the option they refer to
// Value of buttons is whether they're enabled or not (block=enabled, inline=disabled). This way, the value of buttons is equal to the span display attribute.
function createButton (id,click,idparent) {
	let button = document.createElement("button");
	button.id = id;
	button.value = "block";
	button.classList.add("selection_button");
	button.innerHTML = id;
	button.onclick = click;
	document.getElementById(idparent).appendChild(button);
}

function optionListener(event) {
	let spans = iframe.contentWindow.document.querySelectorAll("#list span[type=" + event.target.id + "]");
	toggleValue(event.target);

	let value = event.target.value;
	spans.forEach( span => { span.style.display = value; } );
}

function arrayListener(event) {
	let pre = iframe.contentWindow.document.getElementById(event.target.id);
	toggleValue(event.target);
	
	pre.style.display = event.target.value;
}

function toggleValue(item) {
	if (item.value == "none") {
		item.value = "block";
		item.style.backgroundColor = 'lemonchiffon';
	} else {
		item.value = "none";
		item.style.backgroundColor = 'lightgrey';
	}
}

// THE FOLLOWING WAS A CUTE IDEA TO SELECT THE DATA FROM DOMAINS RECORDED, BUT THERE'S NO NEED TO IMPLEMENT IT NOW

/*
function domainListener() {
	let spans = iframe.contentWindow.document.querySelectorAll("#list span[domain=" + event.target.id.replace(/./g,"") + "]");
	toggleValue(event.target);

	spans.forEach( span => { span.style.display = event.target.value; } );
}*/

/*
chrome.storage.local.get("domains", function (storage) {
	storage.domains.forEach( domain => {
		createButton(domain,domainListener,"domainButtons")
	});
});
chrome.storage.onChanged.addListener( function (changeInfo) {
	if (!changeInfo.domains)
		return;
	changeInfo.domains.newValue.forEach( domain => {
		createButton(domain,domainListener,"domainButtons")
	});
});*/