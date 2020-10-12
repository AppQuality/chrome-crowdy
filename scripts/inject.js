"use strict";

tryInject(injectJS);

function injectJS () {
	// ASK FOR COOKIES
	// Cookies can only be accessed from the background page

	let cookieurl = window.location.href.split(":")[0] + "://" + document.domain;
	chrome.runtime.sendMessage({ "type":ARR_COOKIESTART , "data":cookieurl });


	// SEND INITIAL LOCAL STORAGE TO BACKGROUND PAGE

	let local = {};
	for (let i = 0; i < localStorage.length; i++)
		local[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
	chrome.runtime.sendMessage({ "type":STORAGE, "array":ARR_LOCALSTART, "data":local, "domain":document.domain });


	// LISTEN TO INJECTED INTERRUPTS
	// Messages can be exchanged between the content script and the page scripts with the window class.

	window.addEventListener("message", function(event) {
		if (event.source != window)
			return;

		if (event.data.ext == "chrome-crowdy")	// Check if the messagge comes from the extension injected script
			chrome.runtime.sendMessage({ "type":event.data.type, "array":ARR_EVENTS, "data":event.data.data, "domain":window.location.href });
	}, false);


	// APPEND IFRAME  FOR STORAGE EVENTS
	// An iframe is the only way to catch storage events. In fact, 'storage' event listener listens for storage changes that have been made on the same domain BUT in a different window.
	// So you can't only listen for this event in the main page, but you need to listen to it in the iframe.

	let iframe = document.createElement("iframe");
	iframe.setAttribute('id', 'crowdy-frame');
	iframe.style.display = "none";
	document.getElementsByTagName("html")[0].appendChild(iframe);
	iframe.contentWindow.addEventListener('storage', function(e) {
		window.parent.window.postMessage({ "type":"storage", "ext":"chrome-crowdy", "domain":e.url, "data": {"url": e.url, "key": e.key, "oldValue": e.oldValue, "newValue": e.newValue } } ,"*");
	});


	// APPEND SCRIPT FOR CONSOLE AND ERROR EVENTS

	let script = document.createElement("script");
	//script.innerHTML = consoleAndErrorInjection + "\consoleAndErrorInjection(); \n";
	script.innerHTML = code;
	document.getElementsByTagName("html")[0].appendChild(script);
}

var code = `{
	let crowdy = {

		// SEND DATA OF THE CONSOLE TO CONTENT.JS
		writeLogForPage: function (consolearguments, type) {
			window.postMessage({ "type":"console", "ext":"chrome-crowdy", "data": {"type": type, "msg": consolearguments } } ,"*");
		},

		// SEND DATA OF THE ERRORS TO CONTENT.JS
		writeErrorForPage: function (e) {
			let obj = {
				"message": "" + e.message,
				"filename": "" + e.filename,
				"lineno": e.lineno,
				"colno": e.colno,
				"error": "" + e.error
			}
			window.postMessage({ "type":"error", "ext":"chrome-crowdy", "data":obj } , "*");
			return false;
		},

		// INIT CONSOLE
		assignConsole: function () {
		    console.defaultLog = console.log.bind(console);
		    console.log = function(consolearguments){
		    	crowdy.writeLogForPage(consolearguments,"c_log");
		        console.defaultLog.apply(console, [consolearguments]);
		    }
		    console.defaultError = console.error.bind(console);
		    console.error = function(consolearguments){
		    	crowdy.writeLogForPage(consolearguments,"c_error");
		        console.defaultError.apply(console, [consolearguments]);
		    }
		    console.defaultWarn = console.warn.bind(console);
		    console.warn = function(consolearguments) {
		    	crowdy.writeLogForPage(consolearguments,"c_warn");
		        console.defaultWarn.apply(console, [consolearguments]);
		    }
		    console.defaultDebug = console.debug.bind(console);
		    console.debug = function(consolearguments) {
		        crowdy.writeLogForPage(consolearguments,"c_debug");
		        console.defaultDebug.apply(console, [consolearguments]);
		    }
		}
	}
	crowdy.assignConsole();
	window.addEventListener('error',crowdy.writeErrorForPage);	
}
//console.log("bella");
//questoèunerrore
`
