// get the datasets we want to work with //
var mapP = d3.json("us-states.json");
var abbrP = d3.csv("states.csv");
var deathP = d3.csv("mortalityData.csv");
var fundingP = d3.csv("fundingData.csv");
var insuranceP = d3.csv("insuranceData.csv");
var raceP = d3.csv("raceData.csv");
var povertyP = d3.csv("povertyData.csv");

// make the promise for all datasets together //
Promise.all([mapP,abbrP,deathP,fundingP,insuranceP,raceP,povertyP])
       .then(function(values)
{
  // differentiate all of the data //
  var geoData = values[0];
  var states = values[1];
  var mortality = values[2];
  var funding = values[3];
  var insurance = values[4];
  var race = values[5];
  var poverty = values[6];

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

  var insurDict = {};
  insurance.forEach(function(state){
    insurDict[state.State.trim()] = state;
  });

  var raceDict = {};
  race.forEach(function(state){
    raceDict[state.State.trim()] = state;
  });

  var povertyDict = {};
  poverty.forEach(function(state){
    povertyDict[state.State.trim()] = state;
  });

  // add the data from the additonal datasets to one master dataset //
  geoData.features.forEach(function(feature,i)
{
  feature.properties.ABBR = statesDict[feature.properties.name].ABBR;
  feature.properties.deathR = mortDict[feature.properties.name].ALL;
  feature.properties.funds = fundsDict[feature.properties.name].Funding;
  feature.properties.insurance = insurDict[feature.properties.name].percentUninsured;
  feature.properties.percentMinority = 100 - (100 * raceDict[feature.properties.name].White);
  feature.properties.povertyPerc = povertyDict[feature.properties.name].percentPoverty;
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
    var minRate = d3.min(rates);
    var range = maxRate - minRate
    var divisions = range / 5

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
          return d3.interpolateBlues((d.properties.deathR - 70) / maxRate)});
      // add a tooltip in the form of a title //
      states.append("title")
            .text(function(d) {return "State: " + d.properties.name +
                                      " // Mortality Rate: " + d.properties.deathR});
      // when a state is clicked, chart that data on the left (will switch to right later) //
      states.on("click", function(d) {
                firstState(d, states)});

// this is to add text over the map but it looks bad so come back to it?? //
     /*states.append("text")
      .attr("x",function(d) {return geoGenerator.centroid(d)[0]})
      .attr("y",function(d) {return geoGenerator.centroid(d)[1]})
      .text(function(d){return d.properties.ABBR});*/

// sort the data according to how we want to use it
    // cancer research funding -- dollars donated per death per 100,000 in population
      geoData.features.forEach(function(d) {d.properties.donations = (d.properties.funds  / d.properties.deathR) / 1000});
      var donationsData = [];
      geoData.features.forEach(function(d) {donationsData.push(d.properties.donations)});
    // medical insurance -- percent of population without it
      var insuranceData = [];
      geoData.features.forEach(function(d) {insuranceData.push(d.properties.insurance)});
    // poverty -- percent of population living in poverty
      var povertyData = [];
      geoData.features.forEach(function(d) {povertyData.push(d.properties.povertyPerc)});
    // race / ethnicity -- percent of population that is not white
      var raceData = [];
      geoData.features.forEach(function(d) {raceData.push(d.properties.percentMinority)})

// HERE - we need to initialize the pyramids so they can be changed later
   var sample = [povertyData[0],insuranceData[0],donationsData[0],raceData[0]];
   var sample2 = [povertyData[1],insuranceData[1],donationsData[1],raceData[1]];
   var labels = ["% Pop Below Poverty Line", "% Pop w/o Health-Insurance", "Cancer Research Funding*", "% Pop Non-White Race"]

// working with the pyramid on the left
   var svgP1 = d3.select("#pyramid1svg")
                 .attr("width",600)
                 .attr("height",260);
// select rectangles and draw accordingly
   svgP1.selectAll("rect")
        .data(sample)
        .enter()
        .append("rect")
        .attr("x", function(d,i) { return 400 - (d*2);})
        .attr("y", function (d,i)  { return 50 + (i*47);})
        .attr("width", function(d) { return d*2;})
        .attr("height", 30)
        .attr("fill", "#6da9c3");
// select labels for each bar (what is being shown)
   svgP1.selectAll("text")
        .data(labels)
        .enter()
        .append("text")
        .text(function(d) {return d;})
        .attr("x", function(d,i) { return 415;})
        .attr("y", function (d,i)  { return 70 + (i*47);});
// select labels for each of the bar (the numbers/data)
   svgP1.selectAll("#graphLabels")
        .data(sample)
        .enter()
        .append("text")
        .text(function(d) {return d3.format(",.1f")(d)})
        .attr("id", "graphLabels")
        .attr("x", 360)
        .attr("y", function(d,i) {return 70 + (i*47)})
        .attr("fill", "black")
        .attr("font-weight", "bold");
// label which state is being shown
  svgP1.append("text")
       .text("Alabama")
       .attr("id", "stateName1")
       .attr("x", 300)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%")
       .attr("font-weight", "bold");
// specify scales and where the data came from
/*  svgP1.append("text")
       .text("*Funding reported in Thousands of Dollars per Death per 100,000")
       .attr("id", "cancer scale")
       .attr("x", 10)
       .attr("y", 280)
       .attr("fill", "black")*/

// working with the pyramid on the right
  var svgP2 = d3.select("#pyramid2svg")
                .attr("width",400)
               .attr("height",260);
// select rectangles and draw accordingly
  svgP2.selectAll("rect")
       .data(sample2)
       .enter()
       .append("rect")
       .attr("x", function(d,i) { return 10;})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "#6da9c3");
// show which state is being plotted on the right
  svgP2.append("text")
       .text("Alaska")
       .attr("id", "stateName2")
       .attr("x", 10)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%")
       .attr("font-weight", "bold");
// select labels for each of the bar (the numbers/data)
  svgP2.selectAll("#graphLabels")
       .data(sample2)
       .enter()
       .append("text")
       .text(function(d) {return d3.format(",.1f")(d)})
       .attr("id", "graphLabels")
       .attr("x", 20)
       .attr("y", function(d,i) {return 70 + (i*47)})
       .attr("fill", "black")
       .attr("font-weight", "bold");
};


// function for updating the left pyramid when that state is clicked
var firstState = function(stateData, states) {
    var name = stateData.properties.name
    // select the svg for the pyramids //
    var svgP1 = d3.select("#pyramid1svg")
    // new data
    var state1 = [stateData.properties.povertyPerc,
                  stateData.properties.insurance,
                  stateData.properties.donations,
                  stateData.properties.percentMinority];
//update the rectangles
    svgP1.selectAll("rect")
         .data(state1)
         .transition()
         .duration(600)
         .attr("x", function(d,i) { return 400 - (d*2);})
         .attr("y", function (d,i)  { return 50 + (i*47);})
         .attr("width", function(d) { return d*2;})
         .attr("height", 30)
         .attr("fill", "#6da9c3");
// update the state name
    svgP1.select("#stateName1")
         .text(name)
         .attr("id", "stateName1")
         .attr("x", 300)
         .attr("y", 20)
         .attr("fill", "blue")
         .attr("font-size", "150%");
// update the numbers
    svgP1.selectAll("#graphLabels")
         .data(state1)
         .text(function(d) {return d3.format(",.1f")(d)})
         .attr("x", 360)
         .attr("y", function(d,i) {return 70 + (i*47)})
         .attr("fill", "black")
         .attr("font-weight", "bold");
// now when states are clicked, they should update the right pyramid
    states.on("click", function(d) {
                secondState(d,states)});
};


// function for updating the right pyramid when that state is clicked
var secondState = function(stateData, states) {
  var name = stateData.properties.name

  // select the svg for the pyramids //
  var svgP2 = d3.select("#pyramid2svg")
  // new data
  var state2 = [stateData.properties.povertyPerc,
                stateData.properties.insurance,
                stateData.properties.donations,
                stateData.properties.percentMinority];
// update the rectangles
  svgP2.selectAll("rect")
       .data(state2)
       .transition()
       .duration(600)
       .attr("x", function(d,i) { return 10;})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "#6da9c3");
// update the state name
  svgP2.selectAll("#stateName2")
       .text(name)
       .attr("id", "stateName2")
       .attr("x", 10)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%");
// update the numbers
  svgP2.selectAll("#graphLabels")
       .data(state2)
       .text(function(d) {return d3.format(",.1f")(d)})
       .attr("x", 20)
       .attr("y", function(d,i) {return 70 + (i*47)})
       .attr("fill", "black")
       .attr("font-weight", "bold");
// now when a state is clicked, go back to updating left pyramid
  states.on("click", function(d) {
         firstState(d,states)});

};


// function to draw the overlapping line charts
var drawLineChart = function(geoData) {
//collecting all the data we need
    var uninsured = [];
    var donations = [];
    var minority = [];
    var poverty = [];
    (geoData.features).forEach(function(d) {
        if (d.properties.name != "District of Columbia") {
          uninsured.push(+(d.properties.insurance));
          donations.push(d3.format(",.2f")(d.properties.donations));
          minority.push(d3.format(",.2")(d.properties.percentMinority));
          poverty.push(+(d.properties.povertyPerc));}
    })

// getting all 50 states data in one place
    var statesData = [];
    (geoData.features).forEach(function(d) {
        if (d.properties.name != "District of Columbia") {
          statesData.push(d.properties);
        }
    })
// set screen numbers
    var screen = {width:1000,height:550};

    // select the svg for the line chart //
    var svg = d3.select("#linessvg")
                .attr("width",screen.width)
                .attr("height",screen.height);

// set margin numbers
    var margins =
        {
        left:60,
        right:10,
        top:0,
        bottom:40
        }
// specify height and width we will work with
    var width = screen.width - margins.left - margins.right;
    var height = screen.height - margins.top - margins.bottom - 73;

// create scales
    var xScale = d3.scaleLinear()
                   .domain([0,50])
                   .range([margins.left,width]);
    var yScale = d3.scaleLinear()
                   .domain([0,100])
                   .range([height,0]);
// adding all the state names on the bottom axis
var xAxis = svg.append("g")
xAxis.attr("class", "xAxis")
     .selectAll("text")
     .data(statesData)
     .enter()
     .append("text")
     .text(function(d) {return d.name;})
     .attr("x", function() {return -(screen.height - margins.bottom) + 63;})
     .attr("y", function(d,i) {return margins.left/2 + 32 + xScale(i);})
     .style("text-anchor","end")
     .attr("transform","rotate(-90)");
// drawing a line for the bottom axis
var xLine = svg.append("line")
               .attr("class", "xAxis")
               .attr("x1", margins.left)
               .attr("y1", height + 0.5)
               .attr("x2", xScale(width) + 10)
               .attr("y2", height + 0.5)
               .attr("stroke", "black");
// to draw lines so the data is easier to connect to each state
var verticalLines = svg.append("g")
                       .attr("class", "verticalLines")
// draw those vertical lines where they need to be
statesData.forEach(function(d, index) {
      verticalLines.append("line")
                   .attr("class", "verticalLine")
                   .attr("x1",margins.left/2 + xScale(index) + 30)
                   .attr("y1", function(d,i) {
                        var points = [uninsured[index],minority[index],poverty[index]];
                        var yCoord = d3.max(points);
                        return yScale(yCoord)})
                   .attr("x2", margins.left/2 + xScale(index) +30)
                   .attr("y2", height +6)
                   .attr("stroke", "purple");})
// etablish the y axis
   var yAxis = d3.axisLeft()
                  .scale(yScale);
// add text to say what is happening there
   svg.append("text")
      .text("Percent of Population")
      .attr("x", function() {return -(screen.height - margins.bottom) + 150})
      .attr("y", 25)
      .attr("transform","rotate(-90)");
// draw the y axis
  svg.append("g")
     .attr("class", "yAxis")
     .attr("transform", "translate(" + margins.left + ",0)")
     .call(yAxis)
// set the line drawing function
    var line = d3.line()
                 .x(function(d,i) {return margins.left + xScale(i)})
                 .y(function(d) {return yScale(d)})
// labels for the legend
var titles = ["Without Medical Insurance", "Of a Minority Race/Ethnicity", "Living in Poverty"]
// collect the three datasets we want to graph
var threeDatasets = [uninsured,minority,poverty]
// for each of those datasets - draw a line!
threeDatasets.forEach(function(thisData, index2) {
    svg.append("g")
       .attr("classed","line")
       .append("path")
       .datum(thisData)
       .attr("d",line)
       .attr("stroke",function(d) {
         if (index2 == 0) {
           return "red"}
        else if (index2 == 1) {
           return "blue"}
        else if (index2 == 2) {
           return "green"}})
       .attr("fill","none")
       .attr("id","lineGraph");
// also draw the dots for each state
  svg.append("g")
     .attr("class", "dots")
     .selectAll("circle")
     .data(thisData)
     .enter()
     .append("circle")
     .attr("class", "dot")
     .attr("cx", function(d, i) {return margins.left + xScale(i);})
     .attr("cy", function(d) {return yScale(d);})
     .attr("r", 4)
     .attr("fill",function(d) {
       if (index2 == 0) {
         return "#ab2121"}
      else if (index2 == 1) {
         return "#3352A9"}
      else if (index2 == 2) {
         return "#279127"}})
     .on("mouseover", function(d, index) {
         d3.select(this)
           .attr("r", 7)
           .append("title")
           .text(function(irr) {return statesData[index].name + ": " + d})})
     .on("mouseout", function(d, i) {
          d3.select(this)
            .attr("r", 4);});
// draw rectangles for the legend
  svg.append("rect")
     .attr("x", screen.width-210)
     .attr("y", function(d) { return (20*index2)})
     .attr("width", 15)
     .attr("height", 15)
     .attr("fill",function(d) {
       if (index2 == 0) {
         return "#ab2121"}
      else if (index2 == 1) {
         return "#3352A9"}
      else if (index2 == 2) {
         return "#279127"}});
// add text to the legend
  svg.append("text")
     .attr("x", screen.width - 190)
     .attr("y", function(d) { return (20*index2)+13})
     .text(titles[index2])
// that's it!
  })
}
