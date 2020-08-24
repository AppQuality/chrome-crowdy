"use strict";

function getWebErrors(details) {
	tryWriteEvent(ERRORGET,ARR_EVENTS,details, (details.initiator) ? details.initiator : details.url);
}

function getCookies (changeInfo) {
	tryWriteEvent(COOKIE,ARR_EVENTS,changeInfo,changeInfo.cookie.domain);
}

function getInitialConditions (request, sender, sendResponse) {
	if (request.type == ARR_COOKIESTART) {
		chrome.cookies.getAll({ url:request.data }, function (cookielist) {
			tryWriteEvent(COOKIE, ARR_COOKIESTART, cookielist, request.data);	// This one needs some elaboration, so there is the need of the 'if-else' clause
		});
	}
	else
		tryWriteEvent(request.type, request.array, request.data, request.domain);	// The default data sent to chrome.runtime.onMessagge is a generic event
}

function setListeners() { // Active background page
	chrome.runtime.onMessage.addListener(getInitialConditions);
	chrome.webRequest.onErrorOccurred.addListener(getWebErrors , {urls: ["<all_urls>"]});
	chrome.cookies.onChanged.addListener(getCookies);
}
function unsetListeners() { // Disabled background page
	chrome.runtime.onMessage.removeListener(getInitialConditions);
	chrome.webRequest.onErrorOccurred.removeListener(getWebErrors , {urls: ["<all_urls>"]});
	chrome.cookies.onChanged.removeListener(getCookies);
}

storageInit();

chrome.storage.onChanged.addListener(function (changeInfo) {	// Listen for the recording button to be pressed
	if (!changeInfo['recording'])
		return;
	if (changeInfo['recording'].newValue == 'recording')
		setListeners();
	if (changeInfo['recording'].newValue == 'confirm')
		unsetListeners();
});

// WRITE IN STORAGE

var updates = []; 		// Array of data
var running = false; 	// Mutex 

function tryWriteEvent(type, array, data, domain) {
	updates.push({ 'type':type, 'array':array, 'data': data, 'domain':domain });
	writeEvent();
}

function writeEvent() {
	if (!updates.length || running)
        return;

    running = true;
	chrome.storage.local.get(["num","domains_cookie","domains_storage","options"], function(storage) {
		let num = storage.num;
		let obj = {};
		let tmpUpdates = updates.slice();	// Temporary array to work on. If the updates array gets modified while in the function, the behaviour might not be what we want

		for (let item of tmpUpdates) {	// Elaborate every item in the array, instead of only one, to optimize the calls

			// Check if the data is to store or note, with options flag
			if (!storage.options.cachemiss && item.type == ERRORGET && item.data.error == "net::ERR_CACHE_MISS")
				continue;
			if (!storage.options[item.type])
				continue;

			item.domain = trimDomain(item.domain);

			let storageDomain = (item.array == ARR_COOKIESTART) ? "domains_cookie" : "domains_storage";
			
			// If the item is of type 'initial array', and an item from the same domain has already been stored, don't store it
			if (storage[storageDomain].includes(item.domain) || (obj[storageDomain] && obj[storageDomain].includes(item.domain))) {
				if (item.array != ARR_EVENTS)
					continue;
			} else {
				obj[storageDomain] = storage[storageDomain];
				obj[storageDomain].push(item.domain);
			}
			
			// Write an object in the root. I don't write in arrays because they have to be entirely read and written all times.
			num = num + 1;
			let key = item.array + "|" + ('000000000000' + num.toString()).slice(-12); 	

			obj[key] = {};
			obj[key].time = printDatetime(new Date());
			obj[key].type = item.type;
			obj[key].data = item.data;
			obj[key].domain = item.domain;
		}

		obj["num"] = num;
		updates = updates.filter( x => !tmpUpdates.includes(x));	// Remove from 'updates' the elaborated items of 'tmpUpdates'

		chrome.storage.local.set(obj, () => { preExit(); });
	});
}

function preExit() {	// When 'writeEvent' is finished, if some other data has be inserted, called again 'writeEvent'
	running = false;
	if (updates.length)
		writeEvent();
}

function trimDomain(domain) {	// Give domains the same pattern to be able to compare them
	if (domain.startsWith("http://"))
		return domain.slice(7).split("/")[0];
	if (domain.startsWith("https://"))
		return domain.slice(8).split("/")[0];
	if (domain.startsWith("."))
		return domain.slice(1).split("/")[0];
	return domain.split("/")[0];
}