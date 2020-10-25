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
	let head = "<span id='" + key + "' ";
	if (obj.type)
		head += "type=" + obj.type + " style='display:" + window.parent.document.getElementById(obj.type).value + ";'>";
	else
		head += "style='display:block;'>";
	let body = "<details><summary>";
	if (key.startsWith("events"))
		body += "type: " + obj.type + ", time: " + obj.time + ", domain: " + obj.domain;
	if (key == "extensions")
		body += "details";
	if (array == "starting_localStorage" || array == "starting_cookies")
		body += key;
	body += "</summary>" + JSON.stringify(obj,null,2) + "</details><img class='delete_icon clickable' deleteIcon src='../icons/delete.png'>";
	let tail = "<hr></span>";
	return  head + body + tail;
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
				if (key == "starting_cookies" || key == "starting_localStorage") {
					if (changes[key].newValue)	
						pre.insertAdjacentHTML("beforeend", Object.keys(changes[key].newValue).filter(x => !Object.keys(changes[key].oldValue).includes(x)).reduce(((acc,x) => acc + getPrePiece(changes[key].newValue[x], x, pre.id) ),[]));
					else if (namespace == null && !objectIsEmpty(changes[key]))
						pre.insertAdjacentHTML("beforeend", Object.keys(changes[key]).reduce(((acc,x) => acc + getPrePiece(changes[key][x], x, pre.id) ),[]));
				}
				else if (changes[key].newValue)	// If the call is from the listener.
					pre.insertAdjacentHTML("beforeend", getPrePiece(changes[key].newValue, key, pre.id));
				else if (namespace == null && !objectIsEmpty(changes[key]))	// If the call is from 'update(storage,null)'.
					pre.insertAdjacentHTML("beforeend", getPrePiece(changes[key], key, pre.id));
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
		let pre = item.closest("pre").id;
		if (pre == "starting_localStorage" || pre == "starting_cookies") {
			chrome.storage.local.get([pre], function (storage) {
				delete storage[pre][item.id];
				chrome.storage.local.set(storage);
			});
		} else 
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

function objectIsEmpty (obj) {
	return (Object.keys(obj).length === 0 && obj.constructor === Object);
}