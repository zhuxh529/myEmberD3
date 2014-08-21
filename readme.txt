
Data file description:
1.data file should in json format, which means it stores a Javascript object.

2.data file should have a root, though the root is not shown in waterfall chart. In data_1.json file, 
the root is "flare".

3.data file stores values of bars only at the leaf of hierarchical bars.This means the Javascript only stores
values of bars at bottom level of hierarchy bars.

For example:
Javascript object=
{
"name":root,					//level 0
"children": [
  {
   "name": "lvl1_child1","type": "acc",		//level 1
   "children": [
    {
     "name": "lvl2_child1",			//level 2
     "children": [
      {"name": "lvl3_child1", "size": 2.5},	//level 3
      {"name": "lvl3_child2", "size": 1.3}
     ]
    },
    {
     "name": "lvl2_child2",
     "children": [
      {"name": "lvl3_child3", "size": 2.6},
      {"name": "lvl3_child4", "size": 1.0}
     ]
    },
    {
     "name": "lvl2_child3",
     "children": [
      {"name": "lvl3_child5", "size": 0.2}
     ]
    }
   ]
  }
 ]
}

all values are stored in lvl3_child. In app.js, a d3 function called "partition" will actually get these leafs
values and add them up to form values for their parents' values. Note that values are stored in "size" attribute
of leaf children. When after executing the "partition" function, all bars will have calculated "value" attribute.


4.data file stores "type" of the bars in lvl1_child(level 1 bars), since accumulaitve effects are assumed only to happen at 
level 1 bars. If you go into the hierarchy (go into bars whose levels are bigger then 1), the graph will show bar charts,
rather than waterfall charts. Bar charts always start at y=0 and points upwards.Therefore, for child bars whose
level is bigger than 1, their value should have the SAME SIGNS.


5. For level 1 bars, their "type" has 3 choices: acc,dec,inc.
(1)acc means accumulative bars, which always starts at y=0(not d3 y coordnate, but y-axis 0 in graph). 
(2)dec means decreasing bars, they should have values smaller than 0.
(3)inc means increasing bars, they should have values bigger than 0.

