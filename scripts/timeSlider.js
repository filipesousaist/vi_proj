var dataTime = d3.range(0, 33).map(function(d) {
  return new Date(2017, 11, 25 + d * 30);
});

g_timeRange = [dataTime[0], dataTime[dataTime.length - 1]];
var prevTimeRange = [dataTime[0], dataTime[dataTime.length - 1]];

var sliderRange;

function createSlider() {
  const formatTime = d3.timeFormat('%b %Y')
  
  sliderRange = d3
  .sliderBottom()
  .min(d3.min(dataTime))
  .max(d3.max(dataTime))
  .step(1000 * 60 * 60 * 24 * 30)
  .width(1500)
  .tickFormat(d3.timeFormat('%b %Y'))
  .tickValues(dataTime)
  .default([dataTime[0], dataTime[dataTime.length - 1]])
  .fill('#2196f3')
  .on('end', val => {
    g_timeRange = val
    
    if (formatTime(prevTimeRange[0]) != formatTime(g_timeRange[0]) || 
    formatTime(prevTimeRange[1]) != formatTime(g_timeRange[1])) {
      //update plots
      if (g_timeRange[0] == g_timeRange[1]){
        g_timeRange = [new Date(formatTime(g_timeRange[0])), new Date(formatTime(g_timeRange[0]))]
      }
      else {
        prevTimeRange = g_timeRange.slice();
      }
      updatePlayerCountPlots()
    }
  })


  var gRange = d3
    .select('div#time_slider')
    .append('svg')
    .attr('width', 1600)
    .attr('height', 50)
    .append('g')
    .attr('transform', 'translate(70,10)')

  gRange.call(sliderRange);
}

function resetSlider(){
  sliderRange.value([dataTime[0], dataTime[dataTime.length - 1]])
  g_timeRange = [dataTime[0], dataTime[dataTime.length - 1]];
  prevTimeRange = [dataTime[0], dataTime[dataTime.length - 1]];
}
