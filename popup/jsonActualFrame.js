"use-strict";

var arrays = document.querySelectorAll("#list pre");
var toDelete = [];

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

function getPrePiece(obj,key,array) {
	let head = "<span id='" + key + "' type=" + obj.type + " style='display:" + ((array != "extensions") ? (window.parent.document.getElementById(obj.type).value) : "block") +  ";'>";
	let body = "<details> <summary>" + ((obj.type) ? " { type: " + obj.type + ", time: " + obj.time + ", domain: " + obj.domain + " }" : "details") + "</summary> " + JSON.stringify(obj,null,2) + " </details> <img class='delete_icon clickable' deleteIcon src='../icons/delete.png'>"
	let tail = "<hr></span>";
	return  head + body + tail;
	//return "<span type=" + obj.type + ((obj.domain != undefined) ? (" domain=" + deleteAllChar(obj.domain,".")) : " ") + " style='display:block;'>" + JSON.stringify(obj,null,2) + "<hr></span>";
}

function update(changes, namespace) {
	// For each modifyed key, search the 'pre' that refers to its array. 

	if (changes["recording"] && changes["recording"].newValue == "none") {
		arrays.forEach( pre => { pre.innerHTML = ""; });
		return;
	}

	for (let key in changes)  {
		arrays.forEach( pre => {
			if (key.startsWith(pre.id)) {
				if (changes[key].newValue)	// If the call is from the listener.
					pre.innerHTML += getPrePiece(changes[key].newValue, key, pre.id);
				else if (namespace == null)	// If the call is from 'update(storage,null)'.
					pre.innerHTML += getPrePiece(changes[key], key, pre.id);	
			}
		});
	};
}

function removeItem(event) {
	if (event.target.attributes.deleteIcon) {
		if (!event.target.attributes.deleted) {
			event.target.setAttribute("deleted","");
			event.target.setAttribute("src","../icons/deleted.png");
			toDelete.push(event.target.closest("span"));
		} else {
			event.target.removeAttribute("deleted");
			event.target.setAttribute("src","../icons/delete.png");
			toDelete.splice(toDelete.indexOf(event.target.closest("span")),1);
		}
	}
}

function deleteAll() {
	for (let item of toDelete) {
		chrome.storage.local.remove(item.id);
		item.remove();
	}
}

document.getElementsByTagName("body")[0].addEventListener("click", removeItem, true);
window.addEventListener("message", function (event) { 
	if (event.data.command == "delete")	
		deleteAll(); 
})

chrome.storage.onChanged.addListener(update);	// Update the shown data in real time
chrome.storage.local.get(null, function(storage) {	// Show the recorded data when the page opens.
	update(storage,null);
});