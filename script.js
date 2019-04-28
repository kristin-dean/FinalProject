var mapP = d3.json("us-states.json");
var abbrP = d3.csv("states.csv");
var deathP = d3.csv("mortalityData.csv");

Promise.all([mapP,abbrP,deathP])
       .then(function(values)
{
  var geoData = values[0];
  var states = values[1];
  var mortality = values[2];

  var statesDict = {};
  states.forEach(function(state){
    statesDict[state.NAME.trim()]=state;
  })

  geoData.features.forEach(function(feature)
{
  /*  console.log(feature.properties.name,
      statesDict[feature.properties.name]);
*/

  console.log("mort", mortality.ALL);
  feature.properties.ABBR = statesDict[feature.properties.name].ABBR;

})

  console.log(geoData,states);

  drawMap(geoData);



});

var drawMap = function(geoData)
{
  var screen = {width:1500,height:1000}
    //create Projection
    //var projection = d3.geoAlbersUsa()
    //                  .translate([screen.width/2,screen.height/2]);

    var geoGenerator = d3.geoPath()
//                         .projection(projection);
                        .projection(d3.geoAlbersUsa());
    var svg = d3.select("svg")
                .attr("width",screen.width)
                .attr("height",screen.height);

    var states = svg.append("g")
      .selectAll("g")
      .data(geoData.features)
      .enter()
      .append("g")

      states.append("path")
      .attr("d",geoGenerator)
      .attr("stroke","black")
      .attr("fill","none");

     states.append("text")
      .attr("x",function(d) {return geoGenerator.centroid(d)[0]})
      .attr("y",function(d) {return geoGenerator.centroid(d)[1]})
      .text(function(d){return d.properties.ABBR});
};
