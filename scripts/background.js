"use strict";

// In the following, the 'array' parameter is a string that defines in which final array (events, starting_localStorage, starting_cookies) the object has to be stored.
/*
function getNetworkRequest(request) {
	tryWriteEvent(NETWORK,ARR_EVENTS, request, request.url);
}*/


function getNetworkDebugInfo(source, method, params) {
	chrome.tabs.get(source.tabId, function (tab) {
		//tryWriteEvent(NETWORK,ARR_EVENTS, {method:method, params:params}, tab.url);
		tryWriteEvent(NETWORK,ARR_EVENTS, {method:method, params:params}, tab.url);
	});
}

function attachDebugees() {
	chrome.debugger.onEvent.addListener(getNetworkDebugInfo);
	
	chrome.tabs.getAllInWindow(null, function(tabs) {
		for (let tab of tabs)
			attachTab(null,null,tab);
	});

	chrome.tabs.onUpdated.addListener(attachTab);
}

function isAttachable(url) {
	return (url && url.startsWith("http") && !url.startsWith("https://docs.google.com") && url != "");
}

function attachTab (tabId, changeInfo, tab) {
	if (changeInfo && changeInfo.url && changeInfo.url != "") {
		if (isAttachable(tab.url) || isAttachable(tab.pendingUrl)) {
			chrome.debugger.attach({ tabId: tab.id },"1.3");
			chrome.debugger.sendCommand({ tabId: tab.id }, "Network.enable");
		}
	}
}

function detachDebugees() {
	chrome.debugger.onEvent.removeListener(getNetworkDebugInfo);

	chrome.debugger.getTargets(function (targets) {
		for (let target of targets) {
			if (target.attached) {
				if (target.type == "page")
					chrome.debugger.detach({ tabId:target.tabId });
				if (target.type == "background_page")
					chrome.debugger.detach({ extensionId:target.extensionId });
			}
			
		}
	});

	chrome.tabs.onCreated.removeListener(attachTab);
}

function getWebErrors(details) {
	tryWriteEvent(ERRORGET,ARR_EVENTS,details, (details.initiator) ? details.initiator : details.url);
}

function getCookies (changeInfo) {
	tryWriteEvent(COOKIE,ARR_EVENTS,changeInfo,changeInfo.cookie.domain);
}

function getGeneralData (request, sender, sendResponse) {
	if (request.type == ARR_COOKIESTART) {
		chrome.cookies.getAll({ url:request.data }, function (cookielist) {
			tryWriteEvent(COOKIE, ARR_COOKIESTART, cookielist, request.data, request.path);	// This one needs some elaboration, so there is the need of the 'if-else' clause
		});
	}
	else
		tryWriteEvent(request.type, request.array, request.data, request.domain, request.path);	// The default data sent to chrome.runtime.onMessagge is a generic event
}



function setListeners() { // Active background page
	chrome.runtime.onMessage.addListener(getGeneralData);
	chrome.webRequest.onErrorOccurred.addListener(getWebErrors , {urls: ["<all_urls>"]});
	//chrome.webRequest.onCompleted.addListener(getNetworkRequest, {urls: ["<all_urls>"]});
	chrome.cookies.onChanged.addListener(getCookies);
	attachDebugees();
}

function unsetListeners() { // Disable background page
	chrome.runtime.onMessage.removeListener(getGeneralData);
	chrome.webRequest.onErrorOccurred.removeListener(getWebErrors , {urls: ["<all_urls>"]});
	//chrome.webRequest.onCompleted.removeListener(getNetworkRequest, {urls: ["<all_urls>"]});
	chrome.cookies.onChanged.removeListener(getCookies);
	detachDebugees();
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

function tryWriteEvent(type, array, data, domain, path) {
	updates.push({ 'type':type, 'array':array, 'data': data, 'domain':domain, 'path':path });
	writeEvent();
}

function writeEvent() {
	if (!updates.length || running)
        return;

    running = true;
	chrome.storage.local.get(["num",ARR_COOKIESTART,ARR_LOCALSTART,"options"], function(storage) {
		let num = storage.num;
		let obj = {};
		let tmpUpdates = updates.slice();	// Temporary array to work on. If the updates array gets modified while in the function, the behaviour might not be what we want

		for (let item of tmpUpdates) {	// Elaborate every item in the array, instead of only one, to optimize the calls

			// Check if the data is to store or note, with options flag
			if (!storage.options.cachemiss && item.type == ERRORGET && item.data.error == "net::ERR_CACHE_MISS")
				continue;
			if (!storage.options[item.type])
				continue;

			let domain = trimDomain(item.domain);;
			if (item.domain && (item.array == ARR_COOKIESTART || item.array == ARR_LOCALSTART)) {
				if (!(storage[item.array])[domain]) {
					if (obj[item.array] == undefined)
						obj[item.array] = storage[item.array];
					(obj[item.array])[domain] = item.data;
				}
			}
			
			// Write an object in the root. I don't write in arrays because they have to be entirely read and written all times in the chrome.storage.
			if (item.array == ARR_EVENTS) {
				num = num + 1;
				let key = item.array + "|" + ('000000000000' + num.toString()).slice(-12); 	

				obj[key] = {};
				obj[key].time = printDatetime(new Date());
				obj[key].type = item.type;
				obj[key].data = item.data;
				obj[key].domain = domain;
				obj[key].path = item.path;
			}
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
	if (!domain)
		return undefined;
	let res;
	if (domain.startsWith("http://"))
		res = domain.slice(7);
	else if (domain.startsWith("https://"))
		res = domain.slice(8);
	else if (domain.startsWith("."))
		res = domain.slice(1);
	else
		res = domain;
	return res.split("/")[0];
}