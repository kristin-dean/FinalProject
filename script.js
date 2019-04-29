// get the datasets we want to work with //
var mapP = d3.json("us-states.json");
var abbrP = d3.csv("states.csv");
var deathP = d3.csv("mortalityData.csv");

// make the promise for all datasets together //
Promise.all([mapP,abbrP,deathP])
       .then(function(values)
{
  // differentiate all of the data //
  var geoData = values[0];
  var states = values[1];
  var mortality = values[2];

  // dictionaries to sort through the data //
  var statesDict = {};
  states.forEach(function(state){
    statesDict[state.NAME.trim()]=state;
  })

  var mortDict = {};
  mortality.forEach(function(state){
    mortDict[state.State.trim()] = state;
  })

  // add the data from the additonal datasets to one master dataset //
  geoData.features.forEach(function(feature,i)
{
  feature.properties.ABBR = statesDict[feature.properties.name].ABBR;
  feature.properties.deathR = mortDict[feature.properties.name].ALL;
});

  // now start drawing the visualization!! //
  drawMap(geoData);
  drawLineChart(geoData);
});


// draw the map - a lot of stuff depends on this! //
var drawMap = function(geoData)
{
  var screen = {width:875,height:550};

    // establish the projection with data passed in //
    var geoGenerator = d3.geoPath()
                         .projection(d3.geoAlbersUsa());
    // select the svg for the map //
    var svg = d3.select("#mapsvg")
                .attr("width",screen.width)
                .attr("height",screen.height);
   // want to find the max rate so we can scale the colors //
    var rates = []
    var getRates = (geoData.features).forEach(function(d){
                    rates.push(d.properties.deathR) })
    var maxRate = d3.max(rates);

    // create a group for each state //
    var states = svg.append("g")
      .selectAll("g")
      .data(geoData.features)
      .enter()
      .append("g")

      // create a path and use the projection from earlier
      states.append("path")
      .attr("d",geoGenerator)
      .attr("stroke","black")
      .attr("fill",function(d){
          return d3.interpolatePurples((d.properties.deathR - 70) / maxRate)});
      // add a tooltip in the form of a title //
      states.append("title")
            .text(function(d) {return "State: " + d.properties.name +
                                      " // Mortality Rate: " + d.properties.deathR});
      // when a state is clicked, do something with it //
      states.on("click", function(d) {
                console.log(d.properties.name)
                //firstState(d, states)})
                });

// this is to add text over the map but it looks bad so come back to it?? //
     /*states.append("text")
      .attr("x",function(d) {return geoGenerator.centroid(d)[0]})
      .attr("y",function(d) {return geoGenerator.centroid(d)[1]})
      .text(function(d){return d.properties.ABBR});*/
};

var firstState = function(stateData, states) {
    var screen = {width:300,height:300};

    // select the svg for the map //
    var svg = d3.select("#mapsvg")
                .attr("width",screen.width)
                .attr("height",screen.height);

    states.on("click", function(d) {
                console.log(d.properties.name)
                //secondState(d,states)})
                });
};

var secondState = function(stateData, states) {

};

var drawLineChart = function(geoData) {
    console.log("LINES")
}
