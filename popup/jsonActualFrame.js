"use-strict";

var arrays = document.querySelectorAll("#list pre");

// NOT USED
function deleteAllChar(str,char) {
	let oldstr = str;
	let newstr = str.replace(".","");
	while (oldstr != newstr) {
		oldstr = newstr;
		newstr = newstr.replace(".","");
	}
	return newstr;
}

function getPrePiece(obj,array) {
	let head = "<span type=" + obj.type + " style='display:" + ((array != "extensions") ? (window.parent.document.getElementById(obj.type).value) : "block") +  ";'>";
	let body = "<details> <summary>" + ((obj.type) ? " { type: " + obj.type + ", time: " + obj.time + ", domain: " + obj.domain + " }" : "details") + "</summary> " + JSON.stringify(obj,null,2) + " </details>"
	let tail = "<hr></span>";
	return  head + body + tail;
	//return "<span type=" + obj.type + ((obj.domain != undefined) ? (" domain=" + deleteAllChar(obj.domain,".")) : " ") + " style='display:block;'>" + JSON.stringify(obj,null,2) + "<hr></span>";
}

function update(changes, namespace) {
	// For each modifyed key, search the 'pre' that refers to its array. 
	for (let key in changes)  {
		arrays.forEach( pre => {
			if (key.startsWith(pre.id)) {
				if (changes[key].newValue)	// If the call is from the listener.
					pre.innerHTML += getPrePiece(changes[key].newValue, pre.id);	
				else if (changes[key].oldValue)	// If the storage has been cleared, there will be no 'newValue'.
					pre.innerHTML = "";	
				else	// If the call is from 'update(storage,null)'.
					pre.innerHTML += getPrePiece(changes[key], pre.id);	
			}
		});
	};
}

chrome.storage.onChanged.addListener(update);	// Update the shown data in real time
chrome.storage.local.get(null, function(storage) {	// Show the recorded data when the page opens.
	update(storage,null);
});