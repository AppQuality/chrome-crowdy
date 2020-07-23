
function download() {
	chrome.storage.local.get(null, function(data) {
		var element = document.createElement('a');

		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data,null,2)));
		element.setAttribute('download', "recorded.txt");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	});
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.stop) {
			if (confirm("Do you want to stop the recording? All actions will be discarded.")) {
				if (confirm("Do you want to print the recording on a file?")) {
					chrome.storage.local.remove(["num", "recording"]);
					download();
				}
				
				chrome.storage.local.clear();

				chrome.storage.local.set({ "num":1 });
				chrome.storage.local.set({ recording: false });
			}
		}
	}
);

function assignEvent(button) {
	button.addEventListener("click", function (event) {
		chrome.storage.local.get(["num","recording"], function (result) {
			if (!result.recording)
				return;

			num = result.num;

			var obj = {}
			obj[num.toString()] = window.location.href;
			chrome.storage.local.set(obj);
			chrome.storage.local.get(num.toString(),
				function (result) {
					console.log(result);
				}
			);

			num++;
			chrome.storage.local.set({ "num":num });
		});
	});
}

//var buttons = document.querySelectorAll('button, a, [cursor="pointer"]');
//var buttons = document.querySelectorAll("[cursor="pointer"]");
var body = document.getElementsByTagName("body")[0];
var result = [];
dfs(body);
function dfs(element) {
	for (child of element.children) {
		if (getComputedStyle(child).cursor == "pointer" || child.getAttribute("role") == "button")
			result.push(child);
		else
			dfs(child);
	}
}

result.forEach(assignEvent);
