function get(id) {
	return document.getElementById(id);
}

var pointNumBefore = get('point-num-before'),
	toleranceVal = get('tolerance-val'),
	pointNumAfter = get('point-num-after'),
	pointNumTimes = get('point-num-times'),
	durationEl = get('duration'),
	qualityEl = get('quality');

var scaleType = get('toggleScale');

var tolerance = 0.1;
var highQuality = false;
var type = 'logarithmic';

scaleType.innerHTML = type;

var newPoints = simplify(points, tolerance, highQuality);;

var config = {
	type: 'line',
	data: {
		datasets: [{
			label: 'Original',
			backgroundColor: window.chartColors.red,
			borderColor: window.chartColors.red,
			fill: false,
			data: points,
			lineTension: 0
		}, {
			label: 'Reduced',
			backgroundColor: window.chartColors.blue,
			borderColor: window.chartColors.blue,
			fill: false,
			data: newPoints,
			lineTension: 0,
		}]
	},
	options: {
		responsive: true,
		title: {
			display: true,
			text: 'Chart.js Line Chart - Logarithmic'
		},
		scales: {
			xAxes: [{
				display: true,
				type: type,
				ticks: {
					min: 0,
					max: 0.100,
					stepSize: 20
				},
			}],
			yAxes: [{
				display: true,
			}]
		},
		plugins: {
			zoom: {
				// Container for pan options
				pan: {
					// Boolean to enable panning
					enabled: true,

					// Panning directions. Remove the appropriate direction to disable 
					// Eg. 'y' would only allow panning in the y direction
					mode: 'xy'
				},

				// Container for zoom options
				zoom: {
					// Boolean to enable zooming
					enabled: true,

					// Enable drag-to-zoom behavior
					drag: true,

					// Zooming directions. Remove the appropriate direction to disable 
					// Eg. 'y' would only allow zooming in the y direction
					mode: 'xy',
				}
			}
		}
	}
};

var pointsLen = points.length;

pointNumBefore.innerHTML = pointsLen;

function update() {

	var start = typeof performance !== 'undefined' ? performance.now() : +new Date();

	newPoints = simplify(points, tolerance, highQuality);

	var ms = (typeof performance !== 'undefined' ? performance.now() : +new Date()) - start;

	durationEl.innerHTML = Math.round(ms * 100) / 100;

	var i, len, p,
		newLen = newPoints.length;

	pointNumAfter.innerHTML = newLen;
	pointNumTimes.innerHTML = Math.round(pointsLen / newLen);
	toleranceVal.innerHTML = tolerance;	
}

function onSliderChange(e) {
	tolerance = parseFloat(e.value);
	update();
}

function changeData(chart, data, datasetIndex) {
	chart.data.datasets[datasetIndex].data = data;
	chart.update();
}

function updateScales(chart, type) {
    var xScale = chart.scales['x-axis-0'];
    var yScale = chart.scales['y-axis-0'];
    chart.options.scales = {
        xAxes: [{
            id: 'newId',
			display: true,
			type: type,
			ticks: {
				max: 0.100,
				stepSize: 0.1
			},
        }],
        yAxes: [{
            display: true,
        }]
    };
    chart.update();
    // need to update the reference
    xScale = chart.scales['newId'];
    yScale = chart.scales['y-axis-0'];
}

fdSlider.createSlider({
	inp: get('tolerance'),
	step: '0.00005',
	min: 0,
	max: 0.1,
	hideInput: true,
	callbacks: {
		change: [function () {
			newPoints = simplify(points, parseFloat(this.value), highQuality);
			changeData(window.myChart, newPoints, 1);
		}],
		create: [onSliderChange]
	}
});

qualityEl.onchange = function () {
	highQuality = qualityEl.checked;
	update();
};

window.resetZoom = function() {
	window.myChart.resetZoom();
};

document.getElementById('toggleScale').addEventListener('click', function() {
	type = type === 'linear' ? 'logarithmic' : 'linear';
	scaleType.innerHTML = type;
	window.myChart.options.title.text = 'Line Chart - ' + type;
	updateScales(window.myChart, type);
});
document.getElementById('savechart').addEventListener('click', function() {
	var canvas = document.getElementById("chart");
	canvas.toBlob(function(blob) {
	saveAs(blob, "pretty image.png");
	});
});
document.getElementById('export').addEventListener('click', function() {
	saveAs(
		new Blob(
			[JSON.stringify(newPoints, null, 2)],
			{type: "text/plain;charset=utf-8"}
	  ),
	  "export.txt"
  );
});


window.onload = function() {
	var ctx = document.getElementById('chart').getContext('2d');
	window.myChart = new Chart(ctx, config);
};

