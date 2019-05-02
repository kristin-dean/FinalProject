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
  console.log(geoData)
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
      // when a state is clicked, do something with it //
      states.on("click", function(d) {
                console.log(d.properties.name)
                firstState(d, states)});

// this is to add text over the map but it looks bad so come back to it?? //
     /*states.append("text")
      .attr("x",function(d) {return geoGenerator.centroid(d)[0]})
      .attr("y",function(d) {return geoGenerator.centroid(d)[1]})
      .text(function(d){return d.properties.ABBR});*/

// how do we want to work with the funding data ??
// answer - dollars donated per death per 100,000 in population
  geoData.features.forEach(function(d) {d.properties.donations = (d.properties.funds  / d.properties.deathR) / 1000});
  var donationsData = [];
  geoData.features.forEach(function(d) {donationsData.push(d.properties.donations)});

  var insuranceData = [];
  geoData.features.forEach(function(d) {insuranceData.push(d.properties.insurance)});

  var povertyData = [];
  geoData.features.forEach(function(d) {povertyData.push(d.properties.povertyPerc)});

  var raceData = [];
  geoData.features.forEach(function(d) {raceData.push(d.properties.percentMinority)})

console.log(geoData)
   // HERE - we need to initialize the pyramids so they can be changed later
   var sample = [povertyData[0],insuranceData[0],donationsData[0],raceData[0]];
   var sample2 = [povertyData[1],insuranceData[1],donationsData[1],raceData[1]];
   var labels = ["% Pop Below Poverty Line", "% Pop w/o Health-Insurance", "Cancer Research Funding*", "% Pop Non-White Race"]

   var svgP1 = d3.select("#pyramid1svg")
                 .attr("width",600)
                 .attr("height",300);
  svgP1.selectAll("rect")
       .data(sample)
       .enter()
       .append("rect")
       .attr("x", function(d,i) { return 400 - (d*2);})
       .attr("y", function (d,i)  { return 50 + (i*47);})
       .attr("width", function(d) { return d*2;})
       .attr("height", 30)
       .attr("fill", "blue");
  svgP1.selectAll("text")
       .data(labels)
       .enter()
       .append("text")
       .text(function(d) {return d;})
       .attr("x", function(d,i) { return 415;})
       .attr("y", function (d,i)  { return 70 + (i*47);});
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

  svgP1.append("text")
       .text("Alabama")
       .attr("id", "stateName1")
       .attr("x", 300)
       .attr("y", 20)
       .attr("fill", "blue")
       .attr("font-size", "150%")
       .attr("font-weight", "bold");

  svgP1.append("text")
       .text("*Funding reported in Thousands of Dollars per Death per 100,000")
       .attr("id", "cancer scale")
       .attr("x", 10)
       .attr("y", 280)
       .attr("fill", "black")


  var svgP2 = d3.select("#pyramid2svg")
                .attr("width",400)
               .attr("height",300);
  svgP2.selectAll("rect")
       .data(sample2)
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
       .attr("font-size", "150%")
       .attr("font-weight", "bold");
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

var firstState = function(stateData, states) {
    var name = stateData.properties.name
    // select the svg for the pyramids //
    var svgP1 = d3.select("#pyramid1svg")
    var state1 = [stateData.properties.povertyPerc,
                  stateData.properties.insurance,
                  stateData.properties.donations,
                  stateData.properties.percentMinority];

    svgP1.selectAll("rect")
         .data(state1)
         .transition()
         .duration(600)
         .attr("x", function(d,i) { return 400 - (d*2);})
         .attr("y", function (d,i)  { return 50 + (i*47);})
         .attr("width", function(d) { return d*2;})
         .attr("height", 30)
         .attr("fill", "blue");
    svgP1.select("#stateName1")
         .text(name)
         .attr("id", "stateName1")
         .attr("x", 300)
         .attr("y", 20)
         .attr("fill", "blue")
         .attr("font-size", "150%");
    svgP1.selectAll("#graphLabels")
         .data(state1)
         .text(function(d) {return d3.format(",.1f")(d)})
         .attr("x", 360)
         .attr("y", function(d,i) {return 70 + (i*47)})
         .attr("fill", "black")
         .attr("font-weight", "bold");

    states.on("click", function(d) {
                console.log(d.properties.name)
                secondState(d,states)});
};

var secondState = function(stateData, states) {
  var name = stateData.properties.name

  // select the svg for the pyramids //
  var svgP2 = d3.select("#pyramid2svg")

  var state2 = [stateData.properties.povertyPerc,
                stateData.properties.insurance,
                stateData.properties.donations,
                stateData.properties.percentMinority];

  svgP2.selectAll("rect")
       .data(state2)
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
  svgP2.selectAll("#graphLabels")
       .data(state2)
       .text(function(d) {return d3.format(",.1f")(d)})
       .attr("x", 20)
       .attr("y", function(d,i) {return 70 + (i*47)})
       .attr("fill", "black")
       .attr("font-weight", "bold");

  states.on("click", function(d) {
         console.log(d.properties.name)
         firstState(d,states)});

};

var drawLineChart = function(geoData) {
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
    console.log("HERE" + uninsured);
    console.log(donations);
    console.log(minority);
    console.log(poverty);

    var statesData = [];
    (geoData.features).forEach(function(d) {
        if (d.properties.name != "District of Columbia") {
          statesData.push(d.properties);
        }
    })
    console.log(statesData)
    var screen = {width:1000,height:550};

    // select the svg for the line chart //
    var svg = d3.select("#linessvg")
                .attr("width",screen.width)
                .attr("height",screen.height);

    var margins =
        {
        left:60,
        right:10,
        top:0,
        bottom:40
        }

    var width = screen.width - margins.left - margins.right;
    var height = screen.height - margins.top - margins.bottom - 73;

    var xScale = d3.scaleLinear()
                   .domain([0,50])
                   .range([margins.left,width]);

    var yScale = d3.scaleLinear()
                   .domain([0,100])
                   .range([height,0]);
//
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

var xLine = svg.append("line")
               .attr("class", "xAxis")
               .attr("x1", margins.left)
               .attr("y1", height + 0.5)
               .attr("x2", xScale(width) + 10)
               .attr("y2", height + 0.5)
               .attr("stroke", "black");

var verticalLines = svg.append("g")
                       .attr("class", "verticalLines")


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


    var yScale = d3.scaleLinear()
                   .domain([0,100])
                   .range([height,0]);

    var yAxis = d3.axisLeft()
                  .scale(yScale);
   svg.append("text")
      .text("Percent of Population")
      .attr("x", function() {return -(screen.height - margins.bottom) + 150})
      .attr("y", 25)
      .attr("transform","rotate(-90)");

  svg.append("g")
     .attr("class", "yAxis")
     .attr("transform", "translate(" + margins.left + ",0)")
     .call(yAxis)

    var line = d3.line()
                 .x(function(d,i) {return margins.left + xScale(i)})
                 .y(function(d) {return yScale(d)})

var titles = ["Without Medical Insurance", "Of a Minority Race/Ethnicity", "Living in Poverty"]

var threeDatasets = [uninsured,minority,poverty]
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

  svg.append("text")
     .attr("x", screen.width - 190)
     .attr("y", function(d) { return (20*index2)+13})
     .text(titles[index2])

  })
}
