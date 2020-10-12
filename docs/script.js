'use-strict';

const TYPES = ["click","cookie","storage","error","geterror"];

var JSONdata = {};
var JSONtimeobj = {};
var chart;

document.getElementById("file").addEventListener("input",readFile);

function clickFileChooser() {
	document.getElementById("file").click();
}

function readFile(click) {
	document.getElementById("header").classList.toggle("translateHeader");
	const reader = new FileReader();
	reader.addEventListener('load', (event) => {
		JSONdata = JSON.parse(event.target.result);
		JSONtimeobj = getTImeOrderedObj(JSONdata);
		draw();
	});
	reader.readAsText(document.getElementById("file").files[0]);
}

function getTImeOrderedObj(json) {
	let time = 0;
	let JSONtimeobj = {};
	let events = json.events;
	for (let key in events) {
		let item = events[key];
		if (time != item.time) {
			time  = item.time;
			JSONtimeobj[time] = [item];
		} else {
			JSONtimeobj[time].push(item);
		}
	}
	
	return JSONtimeobj;
}

function getTypesList(list) {
	let res = [0,0,0,0,0];
	list.forEach((item) => { res[TYPES.indexOf(item.type)]++; } );
	return res;
}

function draw() {
	google.charts.load('current', {packages: ['corechart', 'bar']});
	google.charts.setOnLoadCallback(drawChart);

	function drawChart() {
		var data = new google.visualization.DataTable();
		
		data.addColumn('timeofday','Time');
		TYPES.forEach((type) => { data.addColumn('number',type); } );

		let finalArr = [];
		Object.keys(JSONtimeobj).forEach((key) => {
			let times = key.split(' ')[1].split(':');
			finalArr.push([{ v:[parseInt(times[0]), parseInt(times[1]), parseInt(times[2])] }].concat(getTypesList(JSONtimeobj[key])));
		});
		data.addRows(finalArr);

		var options = {
			isStacked: true,
			hAxis: {
				title: 'Time',
				format: 'h:mm:ss a'
			},
			vAxis: {
				title: 'Number of events'
			},
			colors: ['#00ff00','#0000ff','#00ffff','#ff0000','#f000f0'],
			backgroundColor: 'lemonchiffon'
		};

		chart = new google.visualization.ColumnChart(document.getElementById('chart'));

		google.visualization.events.addListener(chart, 'select', columnClick);

		chart.draw(data, options);
	}
}

function columnClick () {
	let selectedItem = chart.getSelection()[0];
	if (!selectedItem || selectedItem.row == null) 
		return;

	let div = document.getElementById('detailsdiv');
	div.innerHTML = '';
	Object.values(JSONtimeobj)[selectedItem.row].forEach( (item) => {
		if (TYPES.indexOf(item.type) == selectedItem.column - 1) {
			div.innerHTML += '<pre>' + JSON.stringify(item,null,2) + '</pre><hr>';
		}
	});
}