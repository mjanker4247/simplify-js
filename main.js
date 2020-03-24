$( document ).ready(function()
{

	var pointNumBefore = $('#point-num-before'),
		toleranceVal = $('#tolerance-val'),
		pointNumAfter = $('#point-num-after'),
		pointNumTimes = $('#point-num-times'),
		durationEl = $('#duration'),
		qualityEl = $('#quality');

	
	var scaleType = $('#toggleScale');
	var firstRun = true;
	var tolerance = 0.1;
	var highQuality = false;
	var type = 'logarithmic';

	scaleType.text = type;

	var newPoints = simplify(points, tolerance, highQuality);;

	var ctx = $('#chart');
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

	var myChart = new Chart(ctx, config);
	var pointsLen = points.length;

	pointNumBefore.text = pointsLen;

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

	function buildConfig()
	{
		return {
			delimiter: ',',
			header: false,
			dynamicTyping: true,
			skipEmptyLines: true,
			preview: 0,
			step: undefined,
			encoding: 'utf-8',
			worker: true,
			comments: '#',
			complete: completeFn,
			error: errorFn,
			download: "local"
		};
	}

	function printStats(msg)
	{
		if (msg)
			console.log(msg);

		console.log("       Time:", (end-start || "(Unknown; your browser does not support the Performance API)"), "ms");
		console.log("  Row count:", rowCount);
		console.log("     Errors:", errorCount);
		if (errorCount)
			console.log("First error:", firstError);
	}


	function stepFn(results, parser)
	{
		stepped++;
		if (results)
		{
			if (results.data)
				rowCount += results.data.length;
			if (results.errors)
			{
				errorCount += results.errors.length;
				firstError = firstError || results.errors[0];
			}
		}
	}

	function completeFn(results)
	{
		end = now();

		if (results && results.errors)
		{
			if (results.errors)
			{
				errorCount = results.errors.length;
				firstError = results.errors[0];
			}
			if (results.data && results.data.length > 0)
				rowCount = results.data.length;
		}

		printStats("Parse complete");
		console.log("    Results:", results);
	}

	function errorFn(err, file)
	{
		end = now();
		console.log("ERROR:", err, file);
		enableButton();
	}

	function now()
	{
		return typeof window.performance !== 'undefined'
				? window.performance.now()
				: 0;
	}


	fdSlider.createSlider({
		inp: $('#tolerance'),
		step: '0.00005',
		min: 0,
		max: 0.1,
		hideInput: true,
		callbacks: {
			change: [function () {
				newPoints = simplify(points, parseFloat(this.value), highQuality);
				changeData(myChart, newPoints, 1);
			}],
			create: [onSliderChange]
		}
	});

	$('#qualityEl').change( function () {
		highQuality = qualityEl.checked;
		update();
	});

	$('#resetZoom').click( function() {
		myChart.resetZoom();
	});



	$('#import').click( function()
	{
		errorCount = 0;
		firstError = undefined;

		var config = buildConfig();

		if (!firstRun)
			console.log("--------------------------------------------------");
		else
			firstRun = false;

		if (!$('#files')[0].files.length)
		{
			alert("Please choose at least one file to parse.");
		}
		
		$('#files').parse({
			config: config,
			before: function(file, inputElem)
			{
				start = now();
				console.log("Parsing file...", file);
			},
			error: function(err, file)
			{
				console.log("ERROR:", err, file);
				firstError = firstError || err;
				errorCount++;
			},
			complete: function()
			{
				end = now();
				printStats("Done with all files");
			}
		});
	});

	$('#toggleScale').click( function(){
		type = type === 'linear' ? 'logarithmic' : 'linear';
		scaleType.innerHTML = type;
		myChart.options.title.text = 'Line Chart - ' + type;
		updateScales(myChart, type);
	});
	
	$('#savechart').click( function() {
		$('#chart').toBlob( function(blob) {
			saveAs(blob, "pretty image.png");
		});
	});

	$('#export').click( function() {
		saveAs(
			new Blob(
				[JSON.stringify(newPoints, null, 2)],
				{type: "text/plain;charset=utf-8"}
		  ),
		  "export.txt"
	  );
	});

});		// End Document Ready


