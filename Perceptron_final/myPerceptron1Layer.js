/*--project: my Perceptron - Anya Chaliotis -->
<!--work for UW, iSchool, INFX598 Advanced Data Vis, taught by Jessica Hullman -->
<!--inspired by INFX574 DataSciII, taught by Joshua Blumenstock -->
<!--version control: 
  V1 was - submitted as final deliverable for final project in INFX598
  states: -1 initial; 0 assign values to x1 and x2; 1 calculate total weighted sum; 2 calculate whether Perceptron triggers or not; return to -1
  V2 - add extra stopping points in Perceptron's journey, enables slower viewing of each step, per JoshB feedback
  states: -1 initial; 0 assign values to x1 and x2; 1 calculate weighted sum of each element; 2 calculate total weighted sum; 3 calculate threshold; 4 calculate whether Perceptron triggers or not; return to -1
*/

/**************************************** part 0. DECLARE VARIABLES AND DATA ***************************************************/
    var svg, w1,w2,threshold, state_original=0, data, table, weighted_sum=-1;
    var circles, circles_static, circles_dynamic, radius_sm=30, radius_lg=40, labels, labels_static, labels_dynamic;
    
    var data_orig= { x1_init: -1, x2_init: -1, w_sum: -1, threshold: -1, output: -1}; 
    var data_init= d3.values(data_orig)
    var text_init = ["x1","x2", "w1", "w2", "Σ", "y", "inputs", "weights", "weighted sum: w1 * x1 + w2 * x2", "step function: Σ > threshold ", "output"]; //w<class='sub'>i</class>x<class='sub'>i</class>

    //truth table(s)
    var columns = [ "x1", "x2", "y"];
    var truth_fn;

    var truth_AND = [
        { x1: 1, x2: 1, y: 1 },
        { x1: 1, x2: 0, y: 0 },
        { x1: 0, x2: 1, y: 0 },
        { x1: 0, x2: 0, y: 0 }
    ];

    var truth_OR = [
        { x1: 1, x2: 1, y: 1 },
        { x1: 1, x2: 0, y: 1 },
        { x1: 0, x2: 1, y: 1 },
        { x1: 0, x2: 0, y: 0 }
    ];

    var truth_XOR = [
        { x1: 1, x2: 1, y: 0 },
        { x1: 1, x2: 0, y: 1 },
        { x1: 0, x2: 1, y: 1 },
        { x1: 0, x2: 0, y: 0 }
    ];

    var selected_row_idx, selected_truth_mode;
    var truthTuple = null; //data format tuple { x1: 1, x2: 0};
    var truthTuple_array, truth_output;
    var data_truthPair; //data format array []
    
/**************************************** end part 0. DECLARE VARIABLES AND DATA ***************************************************/

/**************************************** part 2. PROCESS INPUT ***************************************************/

    function change_weight1() {
        w1 = +d3.select("#input_weight1").node().value;
    }
    function change_weight2() {
        w2 = +d3.select("#input_weight2").node().value;
    }
    function change_threshold() {
        threshold = +d3.select("#input_threshold").node().value;
    }

    function change_truth() {
        truth_fn =  d3.select('input[name="truth_mode"]:checked').node().value
        console.log("truth changed: ", truth_fn);
        if (truth_fn == "AND") {
          //reset 
          selected_row_idx = null;
          selected_truth_mode="AND"
          reset();
          //remove all table
          d3.select("#truth_table").selectAll("table").remove();
          
          //add truth table as input for selecting truth pairs
          var table=tabulate_and_rowIdx(truth_AND, columns);

          //default weights and threshold
          d3.select("#input_weight1").node().value=1
          w1 = +d3.select("#input_weight1").node().value;
          d3.select("#input_weight2").node().value=1
          w2 = +d3.select("#input_weight2").node().value;
          d3.select("#input_threshold").node().value=1.1
          threshold = +d3.select("#input_threshold").node().value;

        }
        else if (truth_fn == "OR") {
          //reset 
          selected_row_idx = null;
          selected_truth_mode="OR"
          reset();
          //remove all table
          d3.select("#truth_table").selectAll("table").remove();
          
          //add truth table as input for selecting truth pairs
          var table=tabulate_and_rowIdx(truth_OR, columns);

          //default weights and threshold
          d3.select("#input_weight1").node().value=1
          w1 = +d3.select("#input_weight1").node().value;
          d3.select("#input_weight2").node().value=1
          w2 = +d3.select("#input_weight2").node().value;
          d3.select("#input_threshold").node().value=0.9;
          threshold = +d3.select("#input_threshold").node().value;

        }
        else if (truth_fn == "XOR") {
          //reset 
          selected_row_idx = null;
          selected_truth_mode="XOR"
          reset();
          //remove all table
          d3.select("#truth_table").selectAll("table").remove();
          
          //add truth table as input for selecting truth pairs
          var table=tabulate_and_rowIdx(truth_XOR, columns);

          //default weights and threshold - not specified
          d3.select("#input_weight1").node().value=1
          w1 = +d3.select("#input_weight1").node().value;
          d3.select("#input_weight2").node().value=1
          w2 = +d3.select("#input_weight2").node().value;
          d3.select("#input_threshold").node().value=null;
          threshold = +d3.select("#input_threshold").node().value;

          d3.select("#result_label").node().value="Now it's your turn:"
          d3.select("#result_msg").node().value="play with weights & threshold";

        }
    }
    
    change_weight1();
    change_weight2();
    change_threshold();
    change_truth();

    //if decide to add XOR hint
    function displayXORhint() {
        
      d3.select("#result_label").node().value="Impossible to find parameters";
      d3.select("#result_msg").node().value="that will work for all XOR pairs";

    };

    //validata input variables - empty or 0 values are not valid
    function validateInput() {
        console.log("inside validateInput", w1, w2, threshold)
        
        if (w1== "" | w2== "" | threshold == "" | w1== 0 | w2== 0 | threshold == 0) {
          console.log("validation failed: ", w1, w2, threshold);
            d3.select("#result_label").node().value="Input validation error: "
            d3.select("#result_msg").node().value="please provide weights & threshold"; //$errormsg: Perceptron doesn't like 0s or empty input
            return false;
        } else {
          d3.select("#result_label").node().value="";
          d3.select("#result_msg").node().value="";
          return true;
        }

    };

    //reset values - used on change of truth modes
    function reset() {
      console.log("inside reset, state_original: ", state_original);
      if (state_original==-1) {
        data=[];
        draw(data);
        notate(data);
      }

      if (selected_row_idx == null) {
        if (selected_truth_mode=="AND") {
          truthTuple=truth_AND[0] //was { x1: 1, x2: 1};
        } else if (selected_truth_mode=="OR") {
          truthTuple=truth_OR[0] 
        } else if (selected_truth_mode=="XOR") {
          truthTuple=truth_XOR[0] 
        } else {console.log ("Error selecting truth mode")};

        truthTuple_array= d3.values(truthTuple);
        data_truthPair=truthTuple_array.slice(0,2);
        truth_output=truthTuple_array.slice(2,3);
        console.log("truthTuple_array: ", data_truthPair)
        state_original=0;
      } else {
        rememberSelectedRow()
      }

      //reset message label
      d3.select("#result_label").node().value="";
      d3.select("#result_msg").node().value="";

    };
    
/**************************************** end part 2. PROCESS INPUT ***************************************************/

/**************************************** COMPUTE functions ***************************************************/
        
    function computeUnit(data) {
  
        //validate input before computing
        if (validateInput()) {
          //step 0. draw original input
          draw(data);
          notate(data); 
          state_original=1; 
          
          //next step 1. compute weighted sum of each element
          setTimeout(function() { computeWeightedSumEach(data);}, 2000); //$acchange - add an extra stopping point
        } 

    };

    //$acchange  - add an extra stopping point
    function computeWeightedSumEach(data) {
        
        //step 1. compute weighted sum of each element
        var me_weighted_sum1 = data[0] * w1;
        var me_weighted_sum2 = data[1] * w2;
        data[0]=me_weighted_sum1;
        data[1]=me_weighted_sum2;

        draw(data);
        notate(data);
        
        state_original=2;
        //next step 2. compute weighted sum total
        setTimeout(function() {computeWeightedSum(data);}, 2000);

    };

    function computeWeightedSum(data) {
        
        //step 2. compute weighted sum total
        var me_weighted_sum = data[0] + data[1];
        data[0]=me_weighted_sum;
        data[1]=me_weighted_sum;
        //$note: real weidhted data, but changed for vis purposes
        if (threshold<me_weighted_sum) {
          weighted_sum=1
        } else {
          weighted_sum=0
        }

        draw(data);
        notate(data);
        
        state_original=3;
        //next step 3. perform step Threshold, no computing
        setTimeout(function() {stepThreshold(data);}, 2000);

    };

    function stepThreshold(data) {
        
        //step 3. perform step Threshold, no computing
        draw(data);
        notate(data);
        
        state_original=4;
        //next step 4. compute perceptron
        setTimeout(function() {computePerceptron(data);}, 2000);

    };

    function computePerceptron(data) {
        //console.log("inside computePerceptron: ", data, threshold);
        
        //step 4. compute perceptron
        var me_output;
        if (data[0] > threshold) {
            me_output = 1
        } else {
            me_output = 0
        };

        data[0]=me_output;
        data[1]=me_output;

        draw(data);
        notate(data);
        state_original=-1;
        weighted_sum=-1;
        //done!
        
        //compare results
        if (me_output==truth_output) {
          d3.select("#result_label").node().value="Success: "
          d3.select("#result_msg").node().value="Perceptron matched Truth table";
        } else {
          d3.select("#result_label").node().value="Error: "
          d3.select("#result_msg").node().value="Perceptron didn't match Truth table";
        }
        
        rememberSelectedRow();
    };

    //if user doesn't click on truth rows to change selection input, use previous input
    function rememberSelectedRow(){
      
      data_truthPair=d3.values(truthTuple)
      data_truthPair=data_truthPair.slice(0,0+2);

      //console.log("reset data_truthPair to last state: ", data_truthPair);
    }


/**************************************** end COMPUTE functions ***************************************************/

/**************************************** UPDATE functions ***************************************************/

    //$acchange, was states 0 to 2, now 0 to 5
    var circle_dynamic_setup = function(circle) {
      //console.log("circle dynamic setup: ", circle, typeof(circle));
      circle.attr('r', function(d, i) {if (weighted_sum==-1 | weighted_sum==0) {return radius_sm} else if (weighted_sum==1){return radius_lg}})
      .attr('cx', function(d, i) {if (state_original==0 ) {if (i==0 ) {return 100} else if (i==1 ) {return 200}} else if (state_original==1) {if (i==0 ) {return 125} else if (i==1 ) {return 175}} else {return 150}})
      .attr('cy', function(d, i) {if (state_original==0 ) {return 100}  else if (state_original==1){return 200-20} else if (state_original==2){return 300-10} else if (state_original==3){return 400} else if (state_original==4){return 500+10}})
      .attr("fill", function(d) {if (state_original==0 | state_original==4 ) {if (d==0){return "blue"} else if (d==1) {return "red"}} else if (state_original==1 | state_original==2 | state_original==3 | state_original==4) {return "orange"}})
      .style("stroke", "none")
      .style("fill-opacity", function(d, i) {if (state_original==0 ) {return .4}  else {return .2}})
        
    }

    var label_dynamic_setup = function(text) {
    //text.text(function(d) {return d;})
    text.attr( "opacity", 0 ).transition().duration(1000).attr( "opacity", 1 ).text(function(d) {return d;})
        .attr('dx', function(d, i) {if (state_original==0 ) {if (i==0 ) {return 100} else if (i==1 ) {return 200}} else if (state_original==1) {if (i==0 ) {return 125} else if (i==1 ) {return 175}} else if (state_original==2 | state_original==3){return 150+15} else if (state_original==4){return 150}})
        .attr('dy', function(d, i) {if (state_original==0 ) {return 100}  else if (state_original==1){return 200-20} else if (state_original==2){return 300} else if (state_original==3){return 400+4} else if (state_original==4){return 500+10}})
    }

    // Update draw/label function
    var draw = function(data) {
      //console.log("inside draw: ", data_truthPair)
      // Bind self.settings.data
      circles = circles_dynamic.selectAll('circle').data(data)
      // Enter new elements
      circles.enter().append('circle').call(circle_dynamic_setup)
      // Exit elements that may have left
      circles.exit().remove()
 
      if (state_original != -1) { 
        // Transition all circles to new settings
      circles.transition().duration(1000).call(circle_dynamic_setup); //$acchange
      }
        
    }

    //notate dynamic - wrapped in a function
    var notate = function(data) {
      //console.log("inside notate: " + data)
      // Bind self.settings.data
      labels = labels_dynamic.selectAll('text').data(data).call(label_dynamic_setup)

      // Enter new elements
      labels.enter().append('text').call(label_dynamic_setup)

      // Exit elements that may have left
      labels.exit().remove()

      // Transition all circles to new dself.settings.data - works for many cases, not for mine here
      //src http://stackoverflow.com/questions/26264169/d3-js-text-enter-within-svg-transition-opacity-0-to-1-wont-end-at-1
      //labels.transition().duration(1000).call(label_dynamic_setup)
    }
    
/****************************************  end UPDATE functions ***************************************************/

/**************************************** INIT functions ***************************************************/

    var circle_static_setup = function(circle) {
      //console.log("inside circle setup: ", circle);
      circle.attr('r', function(d, i) {if (i==2 | i==3 | i==4) {return radius_lg} else {return radius_sm}})
        .attr('cx', function(d, i) {if (i==0 ) {return 100} else if (i==1 ) {return 200} else {return 150}})
        .attr('cy', function(d, i) {if (i==0 | i==1 ) {return 100} else if (i==2) {return 300-10} else if (i==3) {return 400} else if (i==4) {return 500+10}})
        .attr("fill", "white")
        .style("stroke", "grey")
        .style("fill-opacity", function(d, i) {if (i==3) {return 0} else {return 0}})
        .attr("stroke-width", 2)
        .style("stroke-dasharray", function(d, i) {if (i==2 | i==3) {return ("8, 4")} }) //("4, 4"))

    };

    var circle_dynamic_init = function(circle) {
      //console.log("inside circle setup: ", circle);
      circle.attr('r', function(d, i) {return radius_sm})
        .attr('cx', function(d, i) {if (i==0 ) {return 100} else if (i==1 ) {return 200} else {return 150}})
        .attr('cy', function(d, i) {if (i==0 | i==1 ) {return 100} else if (i==2) {return 300-10} else if (i==3) {return 500}})
        .attr("fill", "white")
        .style("stroke", "none")

    };

    var label_static_setup = function(text) {
    text.text(function(d) { if (d!=-1){return d}; })
        .attr('dx', function(d, i) {if (i==0 | i==1) {return i*100 + 100} else if (i==2) {return 125} else if (i==3) {return 175} else if  ( i==5) {return 150} else if (i==4) {return 150 - 15} else {return 350}})
        .attr('dy', function(d, i) {if (i==0 | i==1) {return 100 - 40} else if (i==2 | i==3 | i==7) {return 200} else if (i==4 ) {return 300 + 5} else if (i==5) {return 500 + 65} else if (i==6) {return 100} else if (i==8) {return 300} else if (i==9) {return 400+5} else if (i==10) {return 500+10}})
        .attr('class', function(d, i) { if (i==4){return 'graph-text-oversized'} else {return 'graph-text'}})
        
    };

    var label_dynamic_init = function(text) {
    //text.text(function(d) { return none; }) //$was if (d!=-1){return d};
        text.attr('dx', function(d, i) {if (i==0 ) {return 100} else if (i==1 ) {return 200} else {return 150}})
        .attr('dy', function(d, i) {if (i==0 | i==1 ) {return 100} else if (i==2) {return 300} else if (i==3) {return 500}})
        
    };


    //draw initial graph encapsulated; not to be reused
     var init = function() {
      //console.log("inside init");
        //reset all values
        state_original=0;
              
        //1. initialize circles
        //    separate 2 types of circles: a)static and b)dynamic
        //1a. template with static circles
        circles_static = svg.append("g")
          .attr("class", "circle_static");

        circles_static.selectAll("circle")
            .data(data_init)
            .enter()
            .append("circle").call(circle_static_setup);

        //1b. dynamic circles to work with data
        circles_dynamic = svg.append("g")
          .attr("class", "circle_dynamic");

        circles_dynamic.selectAll("circle")
            .data(data_truthPair)
            .enter()
            .append("circle").call(circle_dynamic_init);

        //2. notate static template
        //separate 2 types of labels: a)static and b)dynamic

        //2a. template with static circles
        //Bind self.settings.data
        labels_static = svg.append("g")
          .attr("class", "circle_static");

        labels_static.selectAll("text")
        // Bind self.settings.data
            .data(text_init)
            .enter()
            .append("text").call(label_static_setup);

        //2b. dynamic labels to work with data
        labels_dynamic = svg.append("g")
        .attr("class", "circle_dynamic");

        labels_dynamic.selectAll("text")
            .data(data_truthPair)
            .enter()
            .append("text").call(label_dynamic_init);

      
        //3. draw 3 static lines to connect the dots in the template
        var line1 = svg.append("line")
        .attr("class", "connecting_line")
        .attr("x1", 100)
        .attr("y1", 100+40)
        .attr("x2", 150)
        .attr("y2", 300-50)
        .style("stroke-dasharray",("8, 4"));
        var line2 = svg.append("line")
        .attr("class", "connecting_line")
        .attr("x1", 200)
        .attr("y1", 100+40)
        .attr("x2", 150)
        .attr("y2", 300-50)
        .style("stroke-dasharray",("8, 4"));
        var line3 = svg.append("line")
        .attr("class", "connecting_line")
        .attr("x1", 150)
        .attr("y1", 330)
        .attr("x2", 150)
        .attr("y2", 360)
        .style("stroke-dasharray",("8, 4"));
        var line3 = svg.append("line")
        .attr("class", "connecting_line")
        .attr("x1", 150)
        .attr("y1", 400+40)
        .attr("x2", 150)
        .attr("y2", 500-30)
        .style("stroke-dasharray",("8, 4"));
        
    };
/****************************************  end INIT functions ***************************************************/

/**************************************** MAIN SVG functions ***************************************************/

    svg = d3.select("#graph").append("svg")
        .attr("width", "100%")
        .attr("height", 0.9 * window.innerHeight)
        //.append("g").attr("transform", "translate(15,35)");
    
    //draw initial graph - not to be reused
    init();

    //add image - step function icon

     svg.append("svg:image")                                                       
      .attr("xlink:href", "img/step_function_gray.png")     
      .attr("width", 60)                                                                
      .attr("height", 50)                                                               
      .attr("x", 150-30 )                                                      
      .attr("y", 400-25 )            
/**************************************** end MAIN SVG functions ***************************************************/

/**************************************** UTILITY functions - TABLE ***************************************************/

function tabulate_and_rowIdx(data, columns) {

var table = d3.select("#truth_table").append("table"),
    thead = table.append("thead"),
    tbody = table.append("tbody");

// append the header row
thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
        .text(function(column) { return column; });

// create a row for each object in the data
var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr")
    .on("click", function(d,i,j) {
      d3.selectAll("tr").classed("table_highlight", false);
      d3.select(this).classed("table_highlight", true);
      //reset();
    });

// create a cell in each row for each column
var cells = rows.selectAll("td")
    .data(function(row) {
        return columns.map(function(column) {
            return {column: column, value: row[column]};
        });
    })
    .enter()
    .append("td")
        .text(function(d) { return d.value; })
        .on("click", function(d,i,j) { highlighted_row(j);});  //gives me the index of the clicked row!;

return table;
}

var highlighted_row=function(i){
  console.log("inside highlighted_row, state_original: ", state_original);
      if (state_original==-1) {
        data=[];
        draw(data);
        notate(data);
      }

  selected_row_idx = i;

  if (selected_truth_mode=="AND") {
          truthTuple=truth_AND[i] //was { x1: 1, x2: 1};
        } else if (selected_truth_mode=="OR") {
          truthTuple=truth_OR[i] 
        } else if (selected_truth_mode=="XOR") {
          truthTuple=truth_XOR[i] 
        } else {console.log ("Error selecting truth mode")};

        truthTuple_array= d3.values(truthTuple);
        data_truthPair=truthTuple_array.slice(0,2);
        truth_output=truthTuple_array.slice(2,3);
        console.log("truthTuple_array: ", data_truthPair)
        state_original=0;

  //reset message label
  d3.select("#result_label").node().value="";
  d3.select("#result_msg").node().value="";

  console.log("picked row", data_truthPair); 
}

/**************************************** end UTILITY functions ***************************************************/