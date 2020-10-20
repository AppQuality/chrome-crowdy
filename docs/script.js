'use-strict';

const TYPES = ["click","error","geterror","network","console"];

var JSONdata = {};
var JSONtimeobj = {};
var chart;

document.getElementById("file").addEventListener("input",readFile);

function getTimeOrderedObj(json) {
	let time = 0;
	let JSONtimeobj = {};
	let events = json.events;
	for (let key in events) {
		let item = events[key];

		if (!TYPES.includes(item.type))
			continue;

		if (time != item.time) {
			time  = item.time;
			JSONtimeobj[time] = [item];
		} else {
			JSONtimeobj[time].push(item);
		}
	}
	return JSONtimeobj;
}

// MAIN FUNCTIONS

function draw() {
	google.charts.load('current', {packages: ['corechart', 'bar']});
	google.charts.setOnLoadCallback(drawChart);

	function drawChart() {
		var data = new google.visualization.DataTable();
		
		data.addColumn('timeofday','Time');
		TYPES.forEach((type) => { data.addColumn('number',type); } );

		let finalArr = [];
		let minTime = undefined;
		let maxTime;
		Object.keys(JSONtimeobj).forEach((key) => {
			if (!minTime)
				minTime = key;

			let times = key.split(' ')[1].split(':');
			finalArr.push([{ v:[parseInt(times[0]), parseInt(times[1]), parseInt(times[2])] }].concat(getTypesList(JSONtimeobj[key])));

			maxTime = key;
		});
		
		data.addRows(finalArr);

		let width = secondsBetween(minTime,maxTime)*25 + 600;
		var options = {
			width: width,
			height: 400,
			isStacked: true,
			hAxis: {
				title: 'Time',
				format: 'h:mm:ss a'
			},
			vAxis: {
				title: 'Number of events'
			},
			colors: ['#00ff00','#0000ff','#00ffff','#ff0000','#f000f0'],
			backgroundColor: { fill:'transparent' },
			bar: { groupWidth:12 }
		};

		chart = new google.visualization.ColumnChart(document.getElementById('chart'));

		google.visualization.events.addListener(chart, 'select', columnClick);

		chart.draw(data, options);
	}
}

function createTables() {
	// EXTENSIONS
	let ext = document.getElementById("ext_list");
	ext.innerHTML = "";
	for (let item of JSONdata.extensions)
		ext.insertAdjacentHTML("beforeend", item.name + " (" + item.version + ")<br>");

	let timeList = [];
	for (let item of JSONdata.events) {
		if (item.type == "cookie" && timeList[timeList.length - 1] != item.time)
			timeList.push(item.time);
	}

	// COOKIES 


	let cookie_table = document.getElementById("cookie_table");
	cookie_table.innerHTML = "";

	let cookieObject = {};
	for (let item of JSONdata.events) {
		if (item.type == "cookie") {
			if (!Object.keys(cookieObject).includes(item.data.cookie.domain + "|" + item.data.cookie.name)) {
				cookieObject[(item.data.cookie.domain + "|" + item.data.cookie.name)] = [{
					time: item.time,
					value: item.data.cookie.value,
					cause: item.data.cause
				}];
			} else {
				cookieObject[(item.data.cookie.domain + "|" + item.data.cookie.name)].push({
					time: item.time,
					value: item.data.cookie.value,
					cause: item.data.cause
				});
			}
		}
	}

	// COOKIE MAIN TABLE
	let table = document.createElement("table");
	cookie_table.append(table);
	let tr1 = document.createElement("tr");
	let th1 = document.createElement("th");
	th1.innerHTML = "Domain";
	table.append(tr1);
	tr1.append(th1);

	let tr, th, td;
	let domain = "";
	for (let key in cookieObject) {
		if (key.split("|")[0] != domain) {
			tr = document.createElement("tr");
			table.append(tr);

			th = document.createElement("th");
			th.innerHTML = key.split("|")[0];
			th.domain = key.split("|")[0];
			th.addEventListener("click",showDomain);
			th.classList.add("clickable");
			tr.append(th);
		}

		td = document.createElement("td");
		td.innerHTML = key.split("|")[1];
		td.key = key;
		td.classList.add("clickable");
		td.addEventListener("click",showCookie);
		tr.append(td);

		domain = key.split("|")[0];
	}

	let hr = document.createElement("hr");
	cookie_table.append(hr);

	// COOKIE TABLES
	for (let key in cookieObject) {
		let table = document.createElement("table");
		table.append(document.createElement("br"));
		cookie_table.append(table);
		table.classList.toggle("hidden");
		table.setAttribute("key",key);
		let tr_time = document.createElement("tr");
		table.append(tr_time);
		let tr_value = document.createElement("tr");
		table.append(tr_value);

		let th = document.createElement("th");
		th.innerHTML = " ";
		tr_time.append(th);
		td = document.createElement("td");
		td.innerHTML = "Starting value";
		tr_time.append(td);
		th = document.createElement("th");
		th.innerHTML = "<p style='color:grey;'>" + key.split("|")[0] + " </p><p> " + key.split("|")[1] + "</p>";
		tr_value.append(th);
		td = document.createElement("td");
		td.innerHTML = "To be inserted";
		tr_value.append(td);

		let td_value;
		let td_time;
		let oldtime = "0";
		for (let value of cookieObject[key]) {
			if (oldtime != value.time) {
				td_value = document.createElement("td");
				tr_value.append(td_value);

				td_time = document.createElement("td");
				td_time.innerHTML = value.time.split(" ")[1];
				tr_time.append(td_time);
			}
			
			td_value.innerHTML += "<pre>" + value.cause + "\n" + value.value + "\n</pre>";

			oldtime = value.time;
		}
	}

	// STORAGE 

	let storage_table = document.getElementById("storage_table");
	storage_table.innerHTML = "";

	let storageObject = {};
	for (let item of JSONdata.events) {
		if (item.type == "storage") {
			if (!Object.keys(storageObject).includes(item.domain + "|" + item.data.key)) {
				storageObject[(item.domain + "|" + item.data.key)] = [{
					time: item.time,
					value: item.data.newValue
				}];
			} else {
				storageObject[(item.domain + "|" + item.data.key)].push({
					time: item.time,
					value: item.data.newValue
				});
			}
		}
	}

	// STORAGE MAIN TABLE
	table = document.createElement("table");
	storage_table.append(table);
	tr1 = document.createElement("tr");
	th1 = document.createElement("th");
	th1.innerHTML = "Domain";
	table.append(tr1);
	tr1.append(th1);

	domain = "";
	for (let key in storageObject) {
		if (key.split("|")[0] != domain) {
			tr = document.createElement("tr");
			table.append(tr);

			th = document.createElement("th");
			th.innerHTML = key.split("|")[0];
			th.domain = key.split("|")[0];
			th.addEventListener("click",showDomain);
			th.classList.add("clickable");
			tr.append(th);
		}

		td = document.createElement("td");
		td.innerHTML = key.split("|")[1];
		td.key = key;
		td.classList.add("clickable");
		td.addEventListener("click",showCookie);
		tr.append(td);

		domain = key.split("|")[0];
	}

	hr = document.createElement("hr");
	storage_table.append(hr);

	// STORAGE TABLES
	for (let key in storageObject) {
		let table = document.createElement("table");
		table.append(document.createElement("br"));
		storage_table.append(table);
		table.classList.toggle("hidden");
		table.setAttribute("key",key);
		let tr_time = document.createElement("tr");
		table.append(tr_time);
		let tr_value = document.createElement("tr");
		table.append(tr_value);

		let th = document.createElement("th");
		th.innerHTML = " ";
		tr_time.append(th);
		td = document.createElement("td");
		td.innerHTML = "Starting value";
		tr_time.append(td);
		th = document.createElement("th");
		th.innerHTML = "<p style='color:grey;'>" + key.split("|")[0] + " </p><p> " + key.split("|")[1] + "</p>";
		tr_value.append(th);
		td = document.createElement("td");
		td.innerHTML = "To be inserted";
		tr_value.append(td);

		let td_value;
		let td_time;
		let oldtime = "0";
		for (let value of storageObject[key]) {
			if (oldtime != value.time) {
				td_value = document.createElement("td");
				tr_value.append(td_value);

				td_time = document.createElement("td");
				td_time.innerHTML = value.time.split(" ")[1];
				tr_time.append(td_time);
			}
			
			td_value.innerHTML += "<pre>" + value.value + "\n</pre>";

			oldtime = value.time;
		}
	}
}

function showCookie(event) {
	let doc;
	if (document.getElementById("cookie_table").contains(event.target))
		doc = document.querySelectorAll("#cookie_table table[key='" + event.target.key + "']");
	else
		doc = document.querySelectorAll("#storage_table table[key='" + event.target.key + "']");

	doc[0].classList.toggle("hidden");
}
function showDomain(event) {
	let doc;
	if (document.getElementById("cookie_table").contains(event.target))
		doc = document.querySelectorAll("#cookie_table table[key^='" + event.target.domain + "']");
	else
		doc = document.querySelectorAll("#storage_table table[key^='" + event.target.domain + "']");
	let hide = false;
	for (let tab of doc) {
		if (!tab.classList.contains("hidden"))
			hide = true;
	}
	for (let tab of doc) {
		if (hide)
			tab.classList.add("hidden");
		else
			tab.classList.remove("hidden");
	}
}

// FUNCTIONS

function getTypesList(list) {
	let res = [];
	TYPES.forEach( item => { res.push(0); } );
	list.forEach((item) => { res[TYPES.indexOf(item.type)]++; } );
	return res;
}

function columnClick () {
	let selectedItem = chart.getSelection()[0];
	if (!selectedItem || selectedItem.row == null) 
		return;

	let div = document.getElementById('detailsdiv');
	div.innerHTML = '';
	Object.values(JSONtimeobj)[selectedItem.row].forEach( (item) => {
		if (TYPES.indexOf(item.type) == selectedItem.column - 1) {
			div.insertAdjacentHTML("beforeend", getPrePiece(item));
		}
	});
}

function getPrePiece(obj,key) {
	let head = "<span type=" + obj.type + " style='display:block" +  ";'>";
	let body = "<details><summary>" + ((obj.type) ? " { type: " + obj.type + ", time: " + obj.time + ", domain: " + obj.domain + " }" : "details") + "</summary>" + JSON.stringify(obj,null,2) + "</details>";
	let tail = "<hr></span>";
	return  head + body + tail;
}

function secondsBetween(min,max) {
	let time1 = min.split(' ')[1].split(':');
	let time2 = max.split(' ')[1].split(':');
	return (time2[0]-time1[0])*3600 + (time2[1]-time1[1])*60 + (time2[2]-time1[2]);
}

// LISTENERS

function changeView(sender) {
	if (!document.getElementById("btn_choose").classList.contains("hidden"))
		return;

	let pages = document.getElementsByClassName("one_page");
	for (let page of pages) {
		if (page.id == sender.getAttribute("on"))
			page.classList.remove("hidden");
		else
			page.classList.add("hidden");
	}
}

function readFile(click) {
	const reader = new FileReader();
	reader.addEventListener('load', (event) => {
		JSONdata = JSON.parse(event.target.result);
		JSONtimeobj = getTimeOrderedObj(JSONdata);
		draw();
		createTables();
		document.getElementById('chart_page').classList.remove("hidden");
		document.getElementById('table_page').classList.add("hidden");
		document.getElementById("btn_choose_mini").classList.remove("hidden");
		document.getElementById("btn_choose").classList.add("hidden");
		document.getElementById("footer").classList.remove("footer_start");
		document.getElementById("footer").classList.add("footer_page");
	});
	reader.readAsText(document.getElementById("file").files[0]);
}

function clickFileChooser() {
	document.getElementById("file").click();
}

function openAll() {
	var det = document.querySelectorAll("details");
	let close = false;
	for (let item of det) {
		if (item.open)
			close = true;
	}
	for (let item of det) {
		if ((close && item.open) || (!close && !item.open))
			item.open = !(item.open);
	}
}