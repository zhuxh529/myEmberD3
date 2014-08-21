/*
* $Revision$
*
* Copyright (c) 2014 by PROS, Inc. All Rights Reserved.
* This software is the confidential and proprietary information of
* PROS, Inc. ("Confidential Information").
* You may not disclose such Confidential Information, and may only
* use such Confidential Information in accordance with the terms of
* the license agreement you entered into with PROS.
*
* If you encounter any problems please contact Xihao Zhu,
* with email zhuxh529@gmail.com
*
*/


App = Ember.Application.create();


/* water-fall global constants starts here*/

var y_low=0; // y's domain down limit initialize

var windowWidth=window.innerWidth;
var windowHeight=window.innerHeight;

var margin = {top: 0.05*windowHeight, right: 0.13*windowWidth, bottom:  0.05*windowHeight, left: 0.09*windowWidth},
    width = 0.75*windowWidth - margin.left - margin.right,
    height = 0.73*windowHeight - margin.top - margin.bottom;
var duration = 750,
    delay = 25; // animation transition variables

var barGap = 1.4; // distance gap between 2 bars
var max, min;
max=Number.MAX_VALUE;
min=Number.MIN_VALUE;

/* water-fall global constants ends here*/




App.WaterfallChartComponent = Ember.Component.extend({
  /* component's own variables*/
  axis_mode:'value',
  barValues:[],
  y:d3.scale.linear().range([0,height]),
  depth:0,
  layer1Data:{},
  barWidth:0,

 /* function didInsertElement()
 * The default function that is executed when you add the component to index.html
 * It will draw the hierarchical bars in the file passed back from index.html
 * The last function of the component, but has alot of sub-functions.
 */
 didInsertElement: function(){

    var cumulated=[];
    var firstCumulated=[];
    var barWidth = 75;
    var datafile=this.get('file');
    var id = this.$().attr('id');
    var y = d3.scale.linear()
        .range([0,height]);

    var percent_y=d3.scale.linear()
        .domain([0,100])
        .range([0,height]);

    var x = d3.scale.linear()
        .range([0, width]);


    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        if(d.depth==1){
        return "<strong style='font-size: 14px;'>Name:</strong> <span style='color:red;font-size: 14px;'>" + d.name.split(":")[0]+ "</span><strong style='font-size: 14px;'>Value:</strong> <span style='color:red;font-size: 14px;'>" + Math.round(d.value*10000) / 10000+ "</span> <strong style='font-size: 14px;'> Percent:</strong><span style='color:red;font-size: 14px;'>" +Math.round(d.value/d.parent.children[0].value*1000)/10+ "%</span> ";
        }
        else{
        return "<strong style='font-size: 14px;'>Name:</strong> <span style='color:red;font-size: 14px;'>" + d.name.split(":")[0]+ "</span><strong style='font-size: 14px;'>Value:</strong> <span style='color:red;font-size: 14px;'>" + Math.round(d.value*10000) / 10000+ "</span> <strong style='font-size: 14px;'> Percent:</strong><span style='color:red;font-size: 14px;'>" +Math.round(d.value/d.parent.value*1000)/10+ "%</span> ";

        }
      });


    var color = d3.scale.ordinal()
        .range(["orange", "#ccc"]);

    var cost_color=d3.scale.ordinal()
        .range(["#CC3333", "#ccc"]);



    var partition = d3.layout.partition()
        .value(function(d) { return d.size; });

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(0)
        .orient("top");

    var width_scale;
    var comp=this;


    //d3 svg initialization
    var svg = d3.select("#"+id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", up);


    // svg.append("text")
    //         .attr("x", (width / 2))
    //         .attr("y", 0 - (margin.top / 2))
    //         .attr("text-anchor", "middle")
    //         .style("font-size", "19px")
    //         .text("My Waterfall Graph");

    svg.append("g")
        .attr("class", "x axis")
        .style({ 'stroke-width': '1.5px'});

    svg.append("g")
        .attr("class", "y axis")
        .style({ 'stroke-width': '1.5px'})
      .append("line")
        .attr("y1", height);

     if(this.get('axis_mode')=="percent") {
      var formatter = d3.format(".0%");
      }




    //parse in the file and execute down function
    d3.json(datafile, function(error, root) {
        partition.sort(null).nodes(root);
        var l=traverseNode(root); /* traverse all the bars in the file
         * so that the barwidth below can be dynamically determined by
        * bars in file
        */
        barWidth=width/(barGap*1.06*l);
        barWidth=barWidth>100?100:barWidth;

        y_low=0;

        y_low=root.children[root.children.length-1].value;
        y_low=y_low<0?y_low:0;

        y.domain([ root.value,y_low]).nice();
        comp.set('barValues', root.children);
        comp.set('barWidth', barWidth);
        comp.set('y', y);
        down(root, 0);
        svg.call(tip);

    });



    /* traverseNode function
    * traverse all the bars in the file
    * so that the barwidth can be dynamically determined by
    * bars in file
    *
    * @param :node, bar node in file
    * @return :max children.length in all hierarchy of the input file
    */
    function traverseNode(node){
      if(!node.children) return 1; // base case
      var maxLength=0;

      for(var nodes=0;nodes< node.children.length;nodes++){
        if(datafile=="data_2.json") {
          var aa=1;
        }
        var nn=traverseNode(node.children[nodes]); //recursively call itself
        maxLength=nn>maxLength?nn:maxLength;
      }
      var l=node.children.length
      return l>maxLength?l:maxLength;

    }




    /* down function
    * when user clicks an expendable bar, down function
    * is executed.
    *
    * @param :d, data
    * @param :i, index
    */
    function down(d, i) {
      if (!d.children || this.__transition__) return;
      comp.set('depth',d.depth);
      comp.set('axis_mode', "value");

      if(d.depth==0){
        comp.set('layer1Data',d.children);
      }


      var end = duration + d.children.length * delay;

      // Mark any currently-displayed bars as exiting.
      var exit = svg.selectAll(".enter")
          .attr("class", "exit");

      // Entering nodes immediately obscure the clicked-on bar, so hide it.
      exit.selectAll("rect").filter(function(p) { return p === d; })
          .style("fill-opacity", 1e-6);

      // Enter the new bars for the clicked-on data.
      // Per above, entering bars are immediately visible.
      var enter = bar(d)
          .attr("transform", barTransitionAnimation(d,i))
          .style("opacity", 1);

      // Have the text fade-in, even though the bars are visible.
      // Color the bars as parents; they will fade to children if appropriate.
      enter.select("text").style("fill-opacity", 1e-6);
      enter.select("rect").style("fill",  function(d){ return (d.depth==1 && d.value<0)?cost_color(true):color(true); })
      .on("mouseover", function(d) { d3.select(this).style("fill","orangered"); tip.show(d); })
      .on("mouseout", function(d) { d3.select(this).style("fill", function(d){return (d.depth==1 && d.value<0)?cost_color(true):color(!!d.children);}); tip.hide(d);});

      // Update the y-scale domain.
      y_low=0;
      if(d.depth==0){
        y_low=d.children[d.children.length-1].value;
        y_low=y_low<0?y_low:0;

      }

      y.domain([ d3.max(d.children, function(d) { return d.value<0?-d.value:d.value; }),y_low]).nice();
      comp.set('y', y);
      // Update the y-axis.
      svg.selectAll(".y.axis").transition()
          .duration(duration)
          .attr("transform", "translate(0,0)")
          .call(yAxis);


      svg.selectAll(".x.axis").transition()
          .duration(duration)
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);


      // Transition entering bars to their new position.
      var enterTransition = enter.transition()
          .duration(duration)
          .delay(function(d, i) { return i * delay; })
          .attr("transform", function(d, i) { return "translate(" + barWidth * i * barGap + ",0)"; });

      // Transition entering text.
      enterTransition.select("text")
          .style("fill-opacity", 1);

      // Transition entering rects to the new x-scale.
      enterTransition.select("rect")
          .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .attr("y", setY(d))
          .style("fill",  function(d) { return (d.depth==1 && d.value<0)?cost_color(true):color(!!d.children); });

      // Transition exiting bars to fade out.
      var exitTransition = exit.transition()
          .duration(duration)
          .style("opacity", 1e-6)
          .remove();

      // Transition exiting bars to the new x-scale.
      exitTransition.selectAll("rect")
          .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .attr("y", setY(d));

      // Rebind the current node to the background.
      svg.select(".background")
          .datum(d)
          .transition()
          .duration(end);

      d.index = i;
    }


    /* up function
    * when user clicks an white space of graph, up function
    * is executed.
    *
    * @param :d, data
    */
    function up(d) {

      if (!d.parent || this.__transition__) return;
      comp.set('depth',d.depth-1);
      comp.set('axis_mode', "value");
      if(d.depth==0){
        comp.set('layer1Data',d.children);
      }


      var end = duration + d.children.length * delay;

      // Mark any currently-displayed bars as exiting.
      var exit = svg.selectAll(".enter")
          .attr("class", "exit");

      // Enter the new bars for the clicked-on data's parent.
      var enter = bar(d.parent)
          .attr("transform", function(d, i) { return "translate(" + barWidth * i * barGap + ",0)"; })
          .style("opacity", 1e-6);

      // Color the bars as appropriate.
      // Exiting nodes will obscure the parent bar, so hide it.
      enter.select("rect")
          .style("fill", function(d) { return (d.depth==1 && d.value<0)?cost_color(true):color(!!d.children); })
        .filter(function(p) { return p === d; })
          .style("fill-opacity", 1e-6);

      // Update the y-scale domain.
      y_low=0;
      if(d.depth==1){
        y_low=d.parent.children[d.parent.children.length-1].value;
        y_low=y_low<0?y_low:0;

      }

     y.domain([ d3.max(d.parent.children, function(d) { return d.value<0?-d.value:d.value;}),y_low]).nice();

      // Update the x-axis.
      svg.selectAll(".y.axis").transition()
          .duration(duration)
          .attr("transform", "translate( 0,0)")
          .call(yAxis);

      svg.selectAll(".x.axis").transition()
          .duration(duration)
          .call(xAxis);

      // Transition entering bars to fade in over the full duration.
      var enterTransition = enter.transition()
          .duration(end)
          .style("opacity", 1);

      // Transition entering rects to the new x-scale.
      // When the entering parent rect is done, make it visible!
      enterTransition.select("rect")
            .attr("y", setY(d))
         .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

      // Transition exiting bars to the parent's position.
      var exitTransition = exit.selectAll("g").transition()
          .duration(duration)
          .delay(function(d, i) { return i * delay; })
          .attr("transform", barTransitionAnimation(d,d.index));

      // Transition exiting text to fade out.
      exitTransition.select("text")
          .style("fill-opacity", 1e-6);

      // Transition exiting rects to the new scale and fade to parent color.
      exitTransition.select("rect")
          .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .attr("y", setY(d) )
          .style("fill", function(d){return (d.depth==1 && d.value<0)?cost_color(true):color(true);});

      // Remove exiting nodes when the last child has finished transitioning.
      exit.transition()
          .duration(end)
          .remove();

      // Rebind the current parent to the background.
      svg.select(".background")
          .datum(d.parent)
        .transition()
          .duration(end);
    }


    /* bar function
    * Creates a set of bars for the given data node,
    * at the specified index.
    *
    * @param :d, data
    */
    function bar(d) {


      var bar = svg.insert("g", ".x.axis")
          .attr("class", "enter")
          .attr("transform", "translate(5,0)")
        .selectAll("g")
          .data(d.children)
        .enter().append("g")
          .style("cursor", function(d) { return !d.children ? null : "pointer"; })
          .on("click", down);

      //append text to bars
      bar.append("text")

          .attr("y", 0)
          .attr("x", 0)

          //.attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d.name.split(":")[0]; });

      bar.selectAll("text")
      .attr("transform", function(d) {
                    return "translate("+barWidth+","+(height+15)+")rotate(-12)" ;
                    });

      bar.append("rect")
           .on("mouseover", function(d) { d3.select(this).style("fill","orangered"); tip.show(d) ;})
           .on("mouseout", function(d) { d3.select(this).style("fill", function(d){return (d.depth==1 && d.value<0)?cost_color(true):color(!!d.children);}); tip.hide(d);})
          .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .attr("width", barWidth)
          .attr("y", setY(d));


      return bar;
    }



    /* findYOffset function
    * find the y axis offset to y(0) by
    * finding the first accumulative bar
    * before i, then add back to the current i
    *
    * @param :data, bar datas
    * @param :i, index
    * @return : the y axis offset
    */
    function findYOffset(data,i){
      var accIndex=i;
      var status=data.type;
      while(status!="acc"){
        accIndex=accIndex-1;
        status=data.parent.children[accIndex].type;
      }

      var ret=0;
      for(var j=accIndex;j<i;j++){
        ret+=data.parent.children[j].value;
      }

      return ret;

    }



    /* barTransitionAnimation function
    * animation effects for
    * hierarchical bar open and close
    *
    * @param :data, bar datas
    * @param :i, index
    * @return :the translate position string
    */
    function barTransitionAnimation(data,i) {

      var y0=0;
      var tmp=0;
      var y_offset=0;
      if(data.parent && data.depth == 1) {
          y_offset=data.value>0?0:y(data.parent.children[i-1].value+data.value)-y(0); // if objects in data file have no 'type' attribute
          if(i==data.parent.children.length-1) y_offset= data.value>0?0:-y(-data.value)+y(0);

          if(data.type != null){
            if(data.type == "acc"){
              y_offset=data.value>0?0:-y(-data.value)+y(0);
            }
            else if(data.type == "dec"){
                    //if previous bar's type is accumulative
                    if (data.parent.children[i-1].type== "acc") {
                        y_offset=y(data.parent.children[i-1].value+data.value)-y(0);
                    }
                    //if previous bar's type is not accumulative
                    else{
                        var vv=findYOffset(data,i);
                        y_offset=y(vv+data.value)-y(0);

                    }
            }
            else if(data.type=="inc"){
                    //if previous bar's type is accumulative
                    if (data.parent.children[i - 1].type=="acc"){
                        y_offset=y(data.parent.children[i - 1].value) - y(0);
                    }
                    //if previous bar's type is not accumulative
                    else{
                        var vv=findYOffset(data,i);
                        y_offset=y(vv) - y(0);
                    }
            }
            var aa=1;
          }

      }

      if(data.depth>1){
        y_offset=0;
      }


      var dataV=data.value>0?data.value:-data.value;
      var uplimit=dataV;
      var downlimit=0;

      //for each bars inside current bar, do the following transition
      return function(d) {
        var dV=d.value>0?d.value:-d.value;


        downlimit=uplimit-dV;
        y0=y(dataV)-y(dV)-tmp+y_offset;
        var tx = "translate(" +barWidth * i * barGap + "," + y0  + ")";
        tmp=tmp+y(uplimit)-y(downlimit);
        uplimit=downlimit;
        if(d.depth>1){
          var a=1;
        }
        return tx;
      };
    }



    /* setY function
    * Set the y coordinates of the target bar
    *
    * @param :data, bar datas
    * @param :i, index
    * @return : y coordinate
    */
    function setY(data){
      cumulated=[];//keeps track of the cumulative increase and decrease of bars
      var index=0;
      return function(d,i){
        if(d.depth==1) {
          if (i==0) {
              cumulated.push(d.value);
          }

          //if the input file has no 'type', this is not recommended.
          if (d.type==null) {
              if (i==d.parent.children.length-1) {
                  return d.value < 0 ? (y(0)) : y(d.value);
              }
              return d.value < 0 ? y(d.parent.children[i-1].value) : y(d.value);
          }
          //if the input file has  'type', this is prefered.
          else {
              if (d.type=="acc") {
                  return d.value < 0 ? (y(0)) : y(d.value);
              }
              else if(d.type=="dec") {
                  var len=cumulated.length-1;
                  cumulated.push(cumulated[len]+d.value);

                  //if previous bar's type is accumulative
                  if (isBarTypeAccumulative(d.parent.children[i - 1])){
                      return y(d.parent.children[i - 1].value);
                  }
                  //if previous bar's type is not accumulative
                  else {
                      return y(cumulated[len]);
                  }
              }
              else if (d.type=="inc") {
                  var len=cumulated.length-1;
                  cumulated.push(cumulated[len]+d.value);

                  //if previous bar's type is accumulative
                  if(isBarTypeAccumulative(d.parent.children[i - 1]) ) {
                    return y(d.parent.children[i-1].value+d.value);
                  }
                  //if previous bar's type is not accumulative
                  else {
                    return y(cumulated[len]+d.value);
                  }
              }
              else{
                alert("data format error: type is wrong dude XD");
              }
            }
        }
        else{
          return d.value<0?y(-d.value):y(d.value);
        }
      }
    }


    /* isBarTypeAccumulative function
    * judge if a bar's type is 'acc'
    *
    * @param :bar, bar
    * @return : true or false
    */
    function isBarTypeAccumulative(bar) {
        return bar.type == "acc";
    }

 },








  /* component's own functions*/
  actions:{

    /* function goClean()
    *clean all the effects on the waterfall charts
    */
    goClean: function(){

      if(d3.selectAll(".newbar")[0].length != 0){
      d3.selectAll(".newbar")
      .remove();
      }
      this.set('axis_mode','percent'); /*so that it can actually go through goValue
       function; axis_mode will be changed back to 'value' in goValue fn.
      */
      this.send('goValue');

    },


    /* function goPercent()
    *change the graph to percent view
    */
    goPercent: function(){
      var whole; // the variable that scales the y values
      if(this.get('axis_mode') == "percent") return;
      this.set('axis_mode', "percent");

      var id = this.$().attr('id');
      var svg = d3.select("#"+id);

      var dmin=0;
      var y = d3.scale.linear()
        .range([0,height]);

      var dd=svg.select(".enter").selectAll("rect")[0][0].__data__;
      whole=(dd.depth==1)?svg.select(".enter").selectAll("rect")[0][0].__data__.parent.children[0].value:dd.parent.value;

      //get the min and max of y's domain
      svg.select(".enter").selectAll("rect").each(function(d){
        var len=d.parent.children.length;
        dmin=(d.depth==1)?d.parent.children[len-1].value:0;

      });

      dmin=dmin>0?0:dmin;
      y.domain([1.2,dmin/Math.abs(whole)]).nice(); // update y's domain
      var cumulated=[];

      //update the existing bar values
      svg.select(".enter").selectAll("rect")
      .transition()
      .duration(duration)
      .attr("height", function(d,i) {
        return Math.abs(y(d.value/whole)-y(0));
      })
      .attr("y", function(d,i){
        //see setY function for more description, they have some minor differences though.
        if(d.depth==1){
            if(i==0) cumulated.push(d.value);
            if(d.type==null){
                  if(i==d.parent.children.length-1) {
                    return d.value<0?(y(0)):y(d.value/whole);
                  }
                  return d.value<0?y(d.parent.children[i-1].value/whole):y(d.value/whole);
            }
            else{
                  if(d.type=="acc"){
                    return d.value<0?(y(0)):y(d.value/whole);
                  }
                  else if(d.type=="dec"){
                    var len=cumulated.length-1; cumulated.push(cumulated[len]+d.value);
                    if(d.parent.children[i-1].type=="acc" ) {
                        return y(d.parent.children[i-1].value/whole);
                    }
                    else {
                      return y(cumulated[len]/whole);}
                  }
                  else if(d.type=="inc"){
                    var len=cumulated.length-1; cumulated.push(cumulated[len]+d.value);
                    if(d.parent.children[i-1].type=="acc" ) {
                        return y(d.parent.children[i-1].value/whole+d.value/whole);
                    }
                    else {
                      return y(cumulated[len]/whole+d.value/whole);}
                  }
                  else{
                    alert("data format error: type is wrong dude XD");
                  }
            }
        }
        else{
            return y(Math.abs(d.value)/Math.abs(whole));
        }
      });
      var formatter = d3.format(".0%");
      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(formatter);

      //update y-axis ticks
      svg.selectAll(".y.axis").transition()
      .duration(duration)
      .attr("transform", "translate( 0,0)")
      .call(yAxis);

    },


    /* function goValue()
    *change the graph from percent view to value view
    *very similar to goPercent function
    */
    goValue: function(){
      var whole;
      if(this.get('axis_mode')=="value") return;
      this.set('axis_mode', "value");

      var id = this.$().attr('id');
      var svg = d3.select("#"+id);

      var dmin=0;
      var dmax=min;
      var y = d3.scale.linear()
        .range([0,height]);
      this.set('y',y);
      var depth=0;
      whole=1;

      //get the min and max of y's domain
      svg.select(".enter").selectAll("rect").each(function(d){
        depth=d.depth;
        var len=d.parent.children.length;
        dmin=(d.depth==1)?d.parent.children[len-1].value:0;
        var tmp=Math.abs(d.value);
        dmax=dmax<tmp?tmp:dmax;
      });


      dmin=dmin>0?0:dmin;
      y.domain([dmax*1.1,dmin]).nice();//update y's domain

      var cumulated=[];


      //update the existing bar values
      svg.select(".enter").selectAll("rect")
      .transition()
      .duration(duration)
      .attr("height", function(d,i) {

        return Math.abs(y(d.value/whole)-y(0));
      })
      .attr("y", function(d,i){
        //see setY function for more description, they have some minor differences though.
        if(d.depth==1){
          if(i==0) cumulated.push(d.value);
          if(d.type==null){
                if(i==d.parent.children.length-1) return d.value<0?(y(0)):y(d.value/whole);
                return d.value<0?y(d.parent.children[i-1].value/whole):y(d.value/whole);
          }
          else{
                if(d.type=="acc"){
                  return d.value<0?(y(0)):y(d.value/whole);
                }
                else if(d.type=="dec"){
                  var len=cumulated.length-1; cumulated.push(cumulated[len]+d.value);
                  if(d.parent.children[i-1].type=="acc" ) {
                    return y(d.parent.children[i-1].value/whole);
                  }
                  else {
                    return y(cumulated[len]/whole);
                  }
                }
                else if(d.type=="inc"){
                  var len=cumulated.length-1; cumulated.push(cumulated[len]+d.value);
                  if(d.parent.children[i-1].type=="acc" ) {
                    return y(d.parent.children[i-1].value/whole+d.value/whole);
                  }
                  else {
                    return y(cumulated[len]/whole + d.value/whole);
                }
                }
                else{
                  alert("data format error: type is wrong dude XD");
                }
          }
        }
        else{
          return y(Math.abs(d.value)/Math.abs(whole));
        }
      });
      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");


      //update y-axis ticks
      svg.selectAll(".y.axis").transition()
      .duration(duration)
      .attr("transform", "translate( 0,0)")
      .call(yAxis);
    },



    /* function goif()
    *this function performs If-scenario
    * when 'If-scenario' butotn is clicked, an editable table
    * will show up. Users can change values of bars and then
    * the graph will add up a new layer of bars with modified
    * values. And the waterfall chart itself will rescale y-axis
    * to fit into both the old charts and the new layer.
    *
    *a very hard function...
    */
    goif: function(){
      if(this.get('axis_mode')=="percent") {
        alert("If-scenario only works for 'value' mode, press button 'To Value' dude XD");return;
      }
      if(this.get('depth')!=0) {
        alert("If-scenario only works for depth=0, navigate to the first level dude XD"); return;
      }

      //when hover on a bar, tip will appear in front of the bar. Here is the tip for new layer of bars
       var tip = d3.tip()
       .attr('class', 'd3-tip')
       .offset([-10, 0])
       .html(function(d) {
        return "<strong style='font-size: 14px;'>Name:</strong> <span style='color:red;font-size: 14px;'>" + d.name.split(":")[0]+ "</span><strong style='font-size: 14px;'>Value:</strong> <span style='color:red;font-size: 14px;'>" + d.value.toFixed(3)+ "</span> <strong style='font-size: 14px;'> Percent: </strong><span style='color:red;font-size: 14px;'><span style='color:red;font-size: 14px;'>" +d.percent.toFixed(2)+ "%</span> ";
      });
      var comp=this;
      var existedCumulative=[];
      var cumulated=[];

      var barWidth=comp.get('barWidth');
      var barData=comp.get('barValues');

      var y=this.get('y');
      var id = this.$().attr('id');
      var svg = d3.select("#"+id);
      svg.select("svg").call(tip);

      var test1=svg.select(".enter");
      var tableDatas=this.get('layer1Data');


      //dynamically create editable table usibf javascript DOM
      var newdiv= document.createElement('div');
      newdiv.className="container hero-unit";
      var table = document.createElement("TABLE");
      table.className="table table-striped";
      var row0 = table.insertRow(0);
      var row1 = table.insertRow(1);
      var cell0, cell1;
      for(var i= 0; i< tableDatas.length;i++){
        cell0=row0.insertCell(i);
        cell1=row1.insertCell(i);
        cell0.innerHTML = tableDatas[i].name;
        cell1.innerHTML = tableDatas[i].value.toFixed(3);

      }



      newdiv.appendChild(table);
      var divId=this.$().attr('id')+"pop";
      newdiv.id=divId;
      var tableId=this.$().attr('id')+"table";
      table.id=tableId;
      document.getElementById(this.$().attr('id')).appendChild(newdiv);
      var newbarValues=[];
      for (var c = 0, m = table.rows[1].cells.length; c < m; c++) {
                newbarValues.push( parseFloat(table.rows[1].cells[c].innerHTML));
            }
      $('.table').editableTableWidget(); // draw the table



      //whenever table changes, it triggers this function, very important here~
      $('.table td').on('change', function(evt, newValue) {

          if( isNaN(parseFloat(newValue))) {alert("You should type in a valid number dude XD"); return;}
          var index=evt.currentTarget.cellIndex; // the index the table is changed

          var diff=0;
          if(index==0) diff=parseFloat(newValue-newbarValues[index]);
          else diff=parseFloat(newValue-newbarValues[index]);
          if((tableDatas[index].type=="acc" && index!=0 )|| index==table.rows[1].cells.length-1) {
            alert("You can't modify cumulated bars Dude XD");return false;
          }
          existedCumulative=[];
          cumulated=[];
          for(var i=index;i<table.rows[1].cells.length;i++){
            if(barData[i].type=="acc"){
              newbarValues[i]=newbarValues[i]+diff; //update abd recalculate the bar values
            }
          }
          newbarValues[index]=newValue;

        //redraw existing bars to new domain
          var ymin=max;
          var ymax=min;
          for(var i=0;i<newbarValues.length;i++){
            if(newbarValues[i]>ymax) ymax=newbarValues[i];
            if(parseFloat(tableDatas[i].value)>ymax) ymax=parseFloat(tableDatas[i].value);
            if(tableDatas[i].value>0 && newbarValues[i]<0) ymin=newbarValues[i];
          }
          var temp=newbarValues[newbarValues.length-1]<tableDatas[tableDatas.length-1].value?newbarValues[newbarValues.length-1]:tableDatas[tableDatas.length-1].value;
          ymin=ymin<temp?ymin:temp;
          ymin=ymin<0?ymin:0;
          y.domain([ymax,ymin]).nice();

          var id = comp.$().attr('id');
          var svg = d3.select("#"+id);

          //update existing bars to new domain
          svg.select(".enter").selectAll("rect")
          .transition()
          .duration(duration)
          .attr("height", function(d,i) {
            return Math.abs(y(d.value)-y(0));
          })
          .attr("y", function(d,i){

            var firstCumulated=[];
            var data=d;
            if(data.depth==0) {firstCumulated=[];}

            var index=0;
            if(d.depth==1){
              if(i==0) existedCumulative.push(d.value);
              if(d.type==null){
                    if(i==d.parent.children.length-1) return d.value<0?(y(0)):y(d.value);
                    return d.value<0?y(d.parent.children[i-1].value):y(d.value);
                }
              else{
                    if(d.type=="acc"){
                      return d.value<0?(y(0)):y(d.value);
                    }
                    else if(d.type=="dec"){
                      var len=existedCumulative.length-1; existedCumulative.push(existedCumulative[len]+d.value);
                      if(d.parent.children[i-1].type=="acc" ) {
                        return y(d.parent.children[i-1].value);
                      }
                      else {
                        return y(existedCumulative[len]);}
                    }
                    else if(d.type=="inc"){
                      var len=existedCumulative.length-1; existedCumulative.push(existedCumulative[len]+d.value);
                      if(d.parent.children[i-1].type=="acc" ) {
                        return y(d.parent.children[i-1].value+d.value);
                      }
                      else {
                        return y(existedCumulative[len]+d.value);}
                    }
                    else{
                      alert("data format error: type is wrong dude XD");
                    }
                  }
            }
            else{
              return d.value<0?y(-d.value):y(d.value);
            }

          });


          var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")

          //update y-axis ticks
          svg.selectAll(".y.axis").transition()
          .duration(duration)
          .attr("transform", "translate( 0,0)")
          .call(yAxis);

          //add a new layer of 'if-senario bars'
          addBars();

      });//end of table td change function


      //Jquery Dialogue decalre
      var dia=$( "#"+this.$().attr('id')+" #"+divId ).dialog({
        autoOpen: false,
        width: 1000,
        modal: true,
        show: {
          effect: "blind",
          duration: 500
        },
        hide: {
          effect: "scale",
          duration: 500
        }
      });
      dia.dialog("open");



        /* function addBars()
        * this function is inside goif() function
        * It is to add a new layer of changed bars
        * to existing bars
        *
        */
      function addBars(){

          if(d3.selectAll(".newbar")[0].length!=0){
              d3.selectAll(".newbar").remove();
          }

            //hard to clone barData to new ones.. so created data, names, types each array to represent barData
              //var newdata=jQuery.extend({}, barData);

          var data=[];
          var names=[];
          var types=[];
          barData.forEach(function(d){ names.push(d.name);types.push(d.type);
          });
          newbarValues.forEach(function(d){ data.push(parseFloat(d));});
          var xx=0;


          //draw new layer of bars
          test1.selectAll("rect")
          .data(data, function(d) {return d+ Math.random()*0.01;})
          .enter()
          .append("rect")
          .attr("class", "newbar")
          .transition()
          .duration(duration)
          .attr("fill-opacity",0.96)
          .attr("fill", "#e6550d")
          .attr("x", function(d,i){ return (barWidth*barGap)*(i+0.3);})
          .attr("height", function(d,i) {
            return Math.abs(y(d)-y(0));
          })
          .attr("width", 0.85*barWidth)
          .attr("y", function(d,i){
            var firstCumulated=[];
            var data1=barData;
            var index=0;
            if(data1[i].depth==1){
              if(i==0) cumulated.push(d);
              if(data1[i].type==null){
                if(i==d.parent.children.length-1) {
                  return d.value<0?(y(0)):y(d.value);
                }
                return d<0?y(data1[i-1].value):y(d);
              }
              else{
                if(data1[i].type=="acc"){
                  return d<0?(y(0)):y(d);
                }
                else if(data1[i].type=="dec"){
                  var len=cumulated.length-1; cumulated.push(cumulated[len]+d);
                  if(data1[i-1].type=="acc" ) {
                    return d<=0?y(data[i-1]):y(data[i-1]+d);
                  }
                  else {
                    return d<=0?y(cumulated[len]):y(cumulated[len]+d);}
                }
                else if(data1[i].type=="inc"){
                  var len=cumulated.length-1; cumulated.push(cumulated[len]+d);
                  if(data1[i-1].type=="acc" ) return d>=0?y(data[i-1]+d):y(data[i-1]);
                  else {
                    return d>=0?y(cumulated[len]+d):y(cumulated[len]);}
                }
                else{
                  alert("data format error: type is wrong dude XD");
                }
              }
            }
          });

          var tipdata = {
                name: "",
                value:0,
                percent : 0
          };


          //add tips to the bars in the new layer
          test1.selectAll(".newbar")
          .on("mouseover", function(d,i) {
                d3.select(this).style("fill","orangered");
                tipdata.name=names[i];
                tipdata.value=d;
                tipdata.percent=100*d/data[0];
                tip.show(tipdata);
          })
          .on("mouseout", function(d,i) {
                d3.select(this).style("fill","#e6550d");
                tip.hide();
          });

      }

    }
  }





  //.observes('axis_mode')

});
