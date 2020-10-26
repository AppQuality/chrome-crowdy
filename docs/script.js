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
	ext.innerHTML = "<ul class='list-group list-group-horizontal'>";
	for (let item of JSONdata.extensions)
		ext.insertAdjacentHTML("beforeend", "<li class='list-group-item border border-1'>" + item.name + " (" + item.version + ")</li>");
	ext.innerHTML + "</ul>";

	// COOKIES 

	let cookie_table = document.getElementById("cookie_table");
	cookie_table.innerHTML = "";

	let cookieObject = {};

	for (let domkey in JSONdata.starting_cookies) {
		for (let storkey in JSONdata.starting_cookies[domkey]) {
			let dom = JSONdata.starting_cookies[domkey][storkey].domain;
			let name = JSONdata.starting_cookies[domkey][storkey].name;
			if (!Object.keys(cookieObject).includes(dom)) {
				cookieObject[dom] = {};
				cookieObject[dom][name] = [{
					time: " Starting_value",
					value: JSONdata.starting_cookies[domkey][storkey].value,
					cause: ""
				}];
			} else if (!Object.keys(cookieObject[dom]).includes(name)) {
				cookieObject[dom][name] = [{
					time: " Starting_value",
					value: JSONdata.starting_cookies[domkey][storkey].value,
					cause: ""
				}];
			}
		}
	}
	for (let item of JSONdata.events) {
		if (item.type == "cookie") {
			if (!Object.keys(cookieObject).includes(item.data.cookie.domain)) {
				cookieObject[item.data.cookie.domain] = {};
				(cookieObject[item.data.cookie.domain])[item.data.cookie.name] = [{
					time: item.time,
					value: item.data.cookie.value,
					cause: item.data.cause
				}];
			} else {
				if (!Object.keys(cookieObject[item.data.cookie.domain]).includes(item.data.cookie.name)) {
					(cookieObject[item.data.cookie.domain])[item.data.cookie.name] = [{
						time: item.time,
						value: item.data.cookie.value,
						cause: item.data.cause
					}];
				} else {
					(cookieObject[item.data.cookie.domain])[item.data.cookie.name].push({
						time: item.time,
						value: item.data.cookie.value,
						cause: item.data.cause
					});
				}
			}
		}
	}

	createGenericTables(cookie_table,cookieObject,"cookie");

	// STORAGE 

	let storage_table = document.getElementById("storage_table");
	storage_table.innerHTML = "";

	let storageObject = {};

	for (let domkey in JSONdata.starting_localStorage) {
		for (let storkey in JSONdata.starting_localStorage[domkey]) {
			if (!Object.keys(storageObject).includes(domkey)) {
				storageObject[domkey] = {};
				storageObject[domkey][storkey] = [{
					time: " Starting_value",
					value: JSONdata.starting_localStorage[domkey][storkey]
				}];
			} else if (!Object.keys(storageObject[domkey]).includes(storkey)) {
				storageObject[domkey][storkey] = [{
					time: " Starting_value",
					value: JSONdata.starting_localStorage[domkey][storkey]
				}];
			}
		}
	}
	for (let item of JSONdata.events) {
		if (item.type == "storage") {
			if (!Object.keys(storageObject).includes(item.domain)) {
				storageObject[item.domain] = {};
				(storageObject[item.domain])[item.data.key] = [{
					time: item.time,
					value: item.data.newValue
				}];
			} else {
				if (!Object.keys(storageObject[item.domain]).includes(item.data.key)) {
					(storageObject[item.domain])[item.data.key] = [{
						time: item.time,
						value: item.data.newValue
					}];
				} else {
					(storageObject[item.domain])[item.data.key].push({
						time: item.time,
						value: item.data.newValue
					});
				}
			}
		}
	}

	createGenericTables(storage_table,storageObject,"storage");

	$('[data-toggle="popover"]').popover({animation: true, html:true});
}

function createGenericTables(container, obj,type) {
	let tableClasses = ["table","table-bordered","table-hover","table-sm","table-responsive","table-striped", "border", "border-0"];

	// MAIN TABLE
	let table = document.createElement("table");
	addTableClasses(table,tableClasses);
	container.append(table);
	let thead = document.createElement("thead");
	table.append(thead);
	let tr1 = document.createElement("tr");
	let th1 = document.createElement("th");
	tr1.classList.add("thead-light");
	th1.innerHTML = "Domain";
	thead.append(tr1);
	tr1.append(th1);

	let tr, th, td;
	let tbody = document.createElement("tbody");
	table.append(tbody);

	for (let key in obj) {
		tr = document.createElement("tr");
		tbody.append(tr);
		th = document.createElement("td");
		th.innerHTML = key;
		th.domain = key;
		th.addEventListener("click",showDomain);
		th.classList.add("clickable");
		tr.append(th);

		for (item in obj[key]) {
			td = document.createElement("td");
			td.innerHTML = item;
			td.key = key + "|" + item;
			td.classList.add("clickable");
			td.addEventListener("click",showCookie);
			tr.append(td);
		}
	}

	// TABLES
	for (let key in obj) {
		for (let item in obj[key]) {
			let table = document.createElement("table");
			addTableClasses(table,tableClasses.concat(["hidden","mini_table"]));
			container.append(table);
			table.setAttribute("key",key + "|" + item);

			thead = document.createElement("thead");
			table.append(thead);
			let tr_time = document.createElement("tr");
			thead.append(tr_time);

			tbody = document.createElement("tbody");
			table.append(tbody);
			let tr_value = document.createElement("tr");
			tbody.append(tr_value);

			let th = document.createElement("th");
			th.innerHTML = " ";
			tr_time.append(th);
			th = document.createElement("th");
			th.innerHTML = "<p style='color:grey;'>" + key + " </p><br><p> " + item + "</p>";
			th.addEventListener("click", hideSelf);
			th.classList.add("clickable");
			tr_value.append(th);

			let td_value;
			let td_time;
			let oldtime = "0";
			for (let value of obj[key][item]) {
				if (oldtime != value.time) {
					if (td_value != null)
						td_value.setAttribute("data-content", td_value.getAttribute("data-content") + "</ul>");

					td_value = document.createElement("td");
					td_value.classList.add("clickable");
					td_value.classList.add("storage_td");
					td_value.setAttribute("data-toggle","popover");
					td_value.setAttribute("title",key + "\n" + item);
					tr_value.append(td_value);

					td_time = document.createElement("td");
					td_time.innerHTML = value.time.split(" ")[1];
					tr_time.append(td_time);
				}
				
				if (type == "cookie")
					addPopupElement(td_value,value.cause + "\n" + value.value);
				else if (type == "storage")
					addPopupElement(td_value,value.value);

				oldtime = value.time;
			}
		}
	}
}

function addPopupElement(td,text) {
	let prev = td.getAttribute("data-content");
	if (prev == null)	prev = "<ul class='list-group'>";
	td.setAttribute("data-content", prev + "<li class='list-group-item'>" + text + "</li>\n");
	if (td.innerHTML == "")
		td.innerHTML = text;
	else if (!td.innerHTML.endsWith("..."))
		td.innerHTML += "\n...";
}

function addTableClasses(table,listOfClasses) {
	for (let str of listOfClasses)
		table.classList.add(str);
}

function hideTable(how,elem) {
	if (how == "toggle") {
		if (elem.classList.contains("hidden"))
			how = "remove";
		else
			how = "add";	
	}
	if (how == "add") {
		elem.classList.add("hidden");
		$("table[key='" + elem.getAttribute("key") + "'] td").popover('hide');
	}
	if (how == "remove") {
		elem.classList.remove("hidden");
	}
	let tds = $("table:not(.hidden) td[aria-describedby]");
	tds.popover('hide');
	tds.popover('show');
}

function hideSelf(event) {
	hideTable("add",event.target.closest("table"));
	//event.target.closest("table").classList.add("hidden");
}

function showCookie(event) {
	let doc;
	if (document.getElementById("cookie_table").contains(event.target))
		doc = document.querySelectorAll("#cookie_table table[key='" + event.target.key + "']");
	else
		doc = document.querySelectorAll("#storage_table table[key='" + event.target.key + "']");

	//doc[0].classList.toggle("hidden");
	hideTable("toggle",doc[0]);
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
			//tab.classList.add("hidden");
			hideTable("add",tab);
		else
			//tab.classList.remove("hidden");
			hideTable("remove",tab);
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
	div.insertAdjacentHTML("beforeend", "<ul class='list-group'>");
	Object.values(JSONtimeobj)[selectedItem.row].forEach( (item) => {
		if (TYPES.indexOf(item.type) == selectedItem.column - 1) {
			div.insertAdjacentHTML("beforeend", getPrePiece(item));
		}
	});
	div.insertAdjacentHTML("beforeend", "</ul>");
}

function getPrePiece(obj,key) {
	let head = "<li type=" + obj.type + " class='list-group-item';'>";
	let body = "<details><summary>" + ((obj.type) ? " { type: " + obj.type + ", time: " + obj.time + ", domain: " + obj.domain + " }" : "details") + "</summary>" + JSON.stringify(obj,null,2) + "</details>";
	let tail = "</li>";
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