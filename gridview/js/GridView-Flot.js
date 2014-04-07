var DATA_POINT_NUMBER = 20;
var UPDATE_INTERVAL = 50;
var DATA_URL = "";

var dataType = "";
var option = {
    legend: {show: false},
    series: {
        lines: { show: true },
        points: { show: false }
    },
    yaxis: {
        show:true,
        min: -30,
        max: 30
    },
    xaxis: {
        show:true,
        mode : "time"
    },
    grid: {
        show:false,
        color: "rgb(255,255,255)",
        borderWidth: 0,
        margin: 0,
        minBorderMargin: 0,
        clickable: false
    }
};

var graphs = [];
var sensorList = document.getElementById("data_type");

var results = [0,0,0];

var keys = {};
var availableSensors = [];

//-----Initialize-----//
function connect()
{
    // Connect to server.
    setIP();

    // Try to get the initial data of the server. If the IP is incorrect, this gives a pop-up.
    try
    {
        var sensorJSON = JSON.parse(httpGet(DATA_URL)).sensors;
    } catch(e)
    {
        alert("Invalid IP address");
    }

    // If the connection succeeded, disable the connect button.
    if(sensorJSON != null){
        document.getElementById("button_connect").disabled = true;

        // Get the dropdown list to be filled.
        var dropdownList = document.getElementById("data_type");

        // Find all sensors and the axis to each sensor.
        for(var key in sensorJSON){
            availableSensors.push(sensorJSON[key].type);
            // We don't handle wifi yet, so we exlude this from the list.
            // The rest of the sensors are added to the dropdown list.
            if(sensorJSON[key].type != "wifi")
            {

                var option = document.createElement("option");
                option.value = key;
                option.id = dropdownList.length;
                
                option.innerHTML = sensorJSON[key].type;
                dropdownList.appendChild(option);
            }
        }
    
    // Now all sensors are added to the list, we are allowed to add them to the scene.
    document.getElementById("button_add").disabled = false;

    // Start plotting.
    setInterval(plot, UPDATE_INTERVAL);
    }
}

// Get the IP value from the textbox.
function setIP()
{
    DATA_URL = document.getElementById("input_ip_address").value;
}

// Get the string from the IP address.
function httpGet(theUrl)
{
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

// Called by the "Add" button to add a new graph to the scene.
function addGraph()
{
    // Check if the data exists, just to be safe. In case it's not there we get it again.
    if(!DATA_URL)
    {
        setIP(); 
    }

    // type is set to hold the location of the sensor in the JSON object.
    var type = sensorList.options[sensorList.options.selectedIndex].value;

    // item is set to hold the location of the sensor in the dropdown list.
    var item = sensorList.options.selectedIndex;

    // If the sensor isn't added yet, we add it, otherwise we show a pop-up
    if(sensorList.options[item].style.display != "none")
    {
        // Create a new Graph object with the sensor number.
        var graph = new Graph(type);

        // Add the new object to the array to store it.
        graphs.push(graph);

        // Hide the sensor that was added from the list
        sensorList.options[item].style.display = "none";

    } else 
    {
        alert("Sensor already added");
    }

    generateDiv(graph, item);
}
 
// The Graph object holds all data related to a single graph.
function Graph(type)
{
    this.id = availableSensors[type];
    this.value = type;

    this.data_x = [];
    this.data_y = [];
    this.data_z = [];

    this.scale = [0 ,0];

    // Fill the data arrays with zero's
    for ( var i=0; i<DATA_POINT_NUMBER; i++) {
        this.data_x.push([0, 0]);
        this.data_y.push([0, 0]);
        this.data_z.push([0, 0]);
    }
}

// Generate and display the divs that hold the graphs.
function generateDiv(graph, item)
{

    // The outer cell div that holds all child elements.
    var cell = document.createElement("div");
    cell.className = "cell";
    cell.id =  graph.value;
    cell.tag = graph.id;
    cell.item = item;

    var title = document.createElement("div");
    title.id = graph.id + "_title";
    title.className = "graph_title";
    title.innerHTML = graph.id;

    // Div to hold the actual graph drawings.
    var graphDiv = document.createElement("div");
    graphDiv.className = "graph";
    graphDiv.id = graph.id; 

    var rmv_button = document.createElement("button");
    rmv_button.id = "button_remove";
    rmv_button.value = graph.id;
    rmv_button.onclick = removeGraph;
    rmv_button.innerHTML = "Remove";

    // Following 3 elements hold the text labels that display the sensor values in numbers.
    var text_field_x = document.createElement("div");
    text_field_x.className = "text_field"
    text_field_x.id = graph.id + "_x";

    var text_field_y = document.createElement("div");
    text_field_y.className = "text_field"
    text_field_y.id = graph.id + "_y"; 
    text_field_y.style.visibility = "hidden";

    var text_field_z = document.createElement("div");
    text_field_z.className = "text_field"
    text_field_z.id = graph.id + "_z";
    text_field_z.style.visibility = "hidden";    

    cell.appendChild(title);
    cell.appendChild(rmv_button);
    cell.appendChild(graphDiv);
    cell.appendChild(text_field_x);
    cell.appendChild(text_field_y);
    cell.appendChild(text_field_z);
    graphview.appendChild(cell);

    document.body.appendChild(graphview);
}

// Remove a div when the Remove button is clicked.
function removeGraph(){
    // Gets the index from the sensor in the dropdown list
    var listIndex = this.parentNode.item;
    var parent = this.parentNode;

    if (listIndex > -1)
    {  
        sensorList.options[listIndex].style.display = "inline";
    }

    // Search the graphs array for the correct element to remove.
    var index = $.map(graphs, function(obj, index){ if(obj.id === parent.tag) return index});
    graphs.splice(index, 1);

    // Finally remove it from the screen
    document.getElementById("graphview").removeChild(parent);
}

// This function calculates the correct scaling values per graph. Due to how this works,
// initial graph drawings are inaccurate, and only become accurate after max and min values
// have been reached.
function recalculateScaling(graph, x, y, z){
    if(x > graph.scale[1]){
        graph.scale[1] = x;
    } else if (x < graph.scale[0]){
        graph.scale[0] = x;
    }
    if(y > graph.scale[1]){
        graph.scale[1] = y;
    } else if (y < graph.scale[0]){
        graph.scale[0] = y;
    }
    if(z > graph.scale[1]){
        graph.scale[1] = z;
    } else if (z < graph.scale[0]){
        graph.scale[0] = z;
    }
}

// Here we finally generate the actual data and send it back to the plotter system of Flot
function generateData(result, type){

    var graph = type;

        if(result.sensors[graph.value].type == "wifi")
        {
            // We already removed Wifi from the options, but someday we will handle it here.
        } else if(result.sensors[graph.value].values.length < 3) 
        {
            // To prevent problems with non-existing values, we handle sensors that don't have 3 values here.
            graph.data_x.shift();
            graph.data_x.push([result.timestamp.values[1], result.sensors[graph.value].values[0]]);

            // Empty the unused arrays.
            graph.data_y.shift();
            graph.data_z.shift();

            results = [result.sensors[graph.value].values[0], 0, 0];

            recalculateScaling(graph, result.sensors[graph.value].values[0], 0, 0); 
        } else 
        {
            // This is the "default" handling of all sensors with 3 values.

            // We shift off the old, first value of the array...
            graph.data_x.shift();
            // ...And add the new time and value at the end.
            graph.data_x.push([result.timestamp.values[1], result.sensors[graph.value].values[0]]);            

            graph.data_y.shift();
            graph.data_y.push([result.timestamp.values[1], result.sensors[graph.value].values[1]]);
            document.getElementById(graph.id + "_y").style.visibility = "visible";

            graph.data_z.shift();
            graph.data_z.push([result.timestamp.values[1], result.sensors[graph.value].values[2]]);
            document.getElementById(graph.id + "_z").style.visibility = "visible";

            results = [result.sensors[graph.value].values[0], result.sensors[graph.value].values[1], result.sensors[graph.value].values[2]];

            recalculateScaling(graph, result.sensors[graph.value].values[0], result.sensors[graph.value].values[1], result.sensors[graph.value].values[2]);
        }

        option.yaxis.min = graph.scale[0];
        option.yaxis.max = graph.scale[1];
    

    return [
    [
    {label : "X", data : graph.data_x, color: "#2ecc71"},
    {label : "Y", data : graph.data_y, color: "#bdc3c7"},
    {label : "Z", data : graph.data_z, color: "#ecf0f1"}],
    option, 
    [results[0], results[1], results[2]]];
}

// The final function sends raw data to the generateData function, and uses the result to finally plot the data using Flot.
function plot() {
    var rawData = JSON.parse(httpGet(DATA_URL));
    for(var i = 0; i < graphs.length; i++){
        if(rawData.sensors[graphs[i].value].values != null){
            var result = generateData(rawData, graphs[i]);
        
        if (DATA_URL === "") {
            return;
        }
        $.plot($("#" + graphs[i].id), result[0], result[1]);
        document.getElementById(graphs[i].id + "_x").innerHTML = result[2][0].toFixed(2);
        document.getElementById(graphs[i].id + "_x").style.color = "#2ecc71";

        document.getElementById(graphs[i].id + "_y").innerHTML = result[2][1].toFixed(2);
        document.getElementById(graphs[i].id + "_y").style.color = "#bdc3c7";

        document.getElementById(graphs[i].id + "_z").innerHTML = result[2][2].toFixed(2);
        document.getElementById(graphs[i].id + "_z").style.color = "#ecf0f1";
    }
    }
}
