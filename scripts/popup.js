
var btn = document.getElementById("btn_record");
var body = document.getElementById("body");

chrome.storage.local.get("recording", function(recording) {
	if (recording.recording) {
		change_to_record();
	}

	btn.addEventListener("click", function(event) {
		if (recording.recording) {
			chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, { stop:true });
			});
		} else {
			recording.recording = true;
			chrome.storage.local.set({ recording: true });
			change_to_record();
		}
	});
});

function change_to_record() {
	btn.innerText = "Stop recording";
	body.style.backgroundColor = "red";
}