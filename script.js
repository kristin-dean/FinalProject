// get the datasets we want to work with //
var mapP = d3.json("us-states.json");
var abbrP = d3.csv("states.csv");
var deathP = d3.csv("mortalityData.csv");
var fundingP = d3.csv("fundingData.csv");

// make the promise for all datasets together //
Promise.all([mapP,abbrP,deathP,fundingP])
       .then(function(values)
{
  // differentiate all of the data //
  var geoData = values[0];
  var states = values[1];
  var mortality = values[2];
  var funding = values[3];

  // dictionaries to sort through the data //
  var statesDict = {};
  states.forEach(function(state){
    statesDict[state.NAME.trim()]=state;
  });

  var mortDict = {};
  mortality.forEach(function(state){
    mortDict[state.State.trim()] = state;
  });

  var fundsDict = {};
  funding.forEach(function(state){
    fundsDict[state.State.trim()] = state;
  });

  // add the data from the additonal datasets to one master dataset //
  geoData.features.forEach(function(feature,i)
{
  feature.properties.ABBR = statesDict[feature.properties.name].ABBR;
  feature.properties.deathR = mortDict[feature.properties.name].ALL;
  feature.properties.funds = fundsDict[feature.properties.name].Funding;
});
console.log(geoData);
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
          return d3.interpolateBlues((d.properties.deathR - 50) / maxRate)});
      // add a tooltip in the form of a title //
      states.append("title")
            .text(function(d) {return "State: " + d.properties.name +
                                      " // Mortality Rate: " + d.properties.deathR});
      // when a state is clicked, do something with it //
      states.on("click", function(d) {
                console.log(d.properties.name)
                firstState(d, states)});

// this is to add text over the map but it looks bad so come back to it?? //
     /*states.append("text")
      .attr("x",function(d) {return geoGenerator.centroid(d)[0]})
      .attr("y",function(d) {return geoGenerator.centroid(d)[1]})
      .text(function(d){return d.properties.ABBR});*/


   // HERE - we need to initialize the pyramids so they can be changed later


   var sample = [100,100,100,100];
   var labels = ["Title 1", "Title 2", "Title 3", "Title 4"]

   var svgP1 = d3.select("#pyramid1svg")
                 .attr("width",350)
                 .attr("height",300);
  svgP1.selectAll("rect")
       .data(sample)
       .enter()
       .append("rect")
       .attr("x", function(d,i) { return 250 - (d*2);})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "blue");
  svgP1.selectAll("text")
       .data(labels)
       .enter()
       .append("text")
       .text(function(d) {return d;})
       .attr("x", function(d,i) { return 275;})
       .attr("y", function (d,i)  { return 70 + (i*47);});

  svgP1.append("text")
       .text("Alabama")
       .attr("id", "stateName1")
       .attr("x", 150)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%");


  var svgP2 = d3.select("#pyramid2svg")
                .attr("width",250)
               .attr("height",300);
  svgP2.selectAll("rect")
       .data(sample)
       .enter()
       .append("rect")
       .attr("x", function(d,i) { return 10;})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "blue");
  svgP2.append("text")
       .text("Alaska")
       .attr("id", "stateName2")
       .attr("x", 10)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%");

};

var firstState = function(stateData, states) {
    var name = stateData.properties.name
    // select the svg for the pyramids //
    var svgP1 = d3.select("#pyramid1svg")

    var sample = [50,50,50,50];

    svgP1.selectAll("rect")
         .data(sample)
         .transition()
         .duration(600)
         .attr("x", function(d,i) { return 250 - (d*2);})
         .attr("y", function (d,i)  { return 50 + (i*47);})
         .attr("width", function(d) { return d*2;})
         .attr("height", 30)
         .attr("fill", "blue");
    svgP1.select("#stateName1")
         .text(name)
         .attr("id", "stateName1")
         .attr("x", 150)
         .attr("y", 20)
         .attr("fill", "blue")
         .attr("font-size", "150%");

    states.on("click", function(d) {
                console.log(d.properties.name)
                secondState(d,states)});
};

var secondState = function(stateData, states) {
  var name = stateData.properties.name

  // select the svg for the pyramids //
  var svgP2 = d3.select("#pyramid2svg")

  var sample = [50,50,50,50];

  svgP2.selectAll("rect")
       .data(sample)
       .transition()
       .duration(600)
       .attr("x", function(d,i) { return 10;})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "blue");
  svgP2.selectAll("#stateName2")
       .text(name)
       .attr("id", "stateName2")
       .attr("x", 10)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%");

  states.on("click", function(d) {
         console.log(d.properties.name)
         firstState(d,states)});

};

var drawLineChart = function(geoData) {
    console.log("LINES");
    var screen = {width:500,height:300};

    // select the svg for the line chart //
    var svg = d3.select("#linessvg")
                .attr("width",screen.width)
                .attr("height",screen.height);

    var margins =
        {
        left:40,
        right:10,
        top:10,
        bottom:40
        }

    var width = screen.width - margins.left - margins.right;
    var height = screen.height - margins.top - margins.bottom;

    var xScale = d3.scaleLinear()
                   .domain(d3.extent(geoData.features))
                   .range([0,width]);

    var yScale = d3.scaleLinear()
                   .domain([0,10000])
                   .range([height,0]);
    var line = d3.line()
                 .x(function(d) {return xScale(d.properties.name)})
                 .y(function(d) {return yScale(d.properties.funds / d.properties.deathR)})

//var findFunds = (geoData.features).forEach(function(d)
  //          { return console.log(d.properties.funds)})

    svg.append("g")
       .attr("classed","line")
       .append("path")
       .datum(geoData)
       .attr("d",line)
       .attr("stroke","blue")
       .attr("fill","none")
       .attr("id","lineGraph")
}
