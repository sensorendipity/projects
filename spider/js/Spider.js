var DATA_URL = "";
var dataString = "";

var allSensors = [];
var activeSensors = [];
var hiddenSensors = [];
var totalValues = 0;
var sensorJSON;
var padding = 200;

var size = window.innerHeight - padding;

$('#spiderArea').width(size).height(size);
$('#settings').height(size + padding);
$('.sensorList').height((size + padding)/2 - 130);

var mesh;
var graphMaterial;
var circleMaterial;
var color;
var nextColor;
var colorArr = [];
var nextColorArr = [];
var webArr = [];
var webLocation = 1;
var globalScale = 4;
var cameraSize = 400;

var renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize(size, size);
renderer.setClearColor( 0x000000 );
var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(-cameraSize, cameraSize, cameraSize, -cameraSize, 1, 1000);
camera.updateMatrixWorld();
//----------------------------------------------------------//

function connect()
{
    // Connect to server.

    setIP();
    // Try to get the initial data of the server. If the IP is incorrect, this gives a pop-up.
    try
    {
    	sensorJSON = JSON.parse(httpGet(DATA_URL)).sensors;  
    } catch(e)
    {
    	alert("Invalid IP address");
    }

    // If the connection succeeded, disable the connect button,
    // populate the drag and drop list, create the materials and start the camera and lights.
    if(sensorJSON != null){
    	document.getElementById("button_connect").disabled = true;
    	populateList();

    	camera.position.set(0,0,100);
    	scene.add(camera);
    	$('#spiderArea').append(renderer.domElement);

    	graphMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, 
    													wireframe: false, 
    													transparent: false, 
    													opacity: 1, 
    													side: THREE.DoubleSide, 
    													vertexColors:THREE.VertexColors } );
    	
    	circleMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, 
    													wireframe: true} );

    	var ambientlight = new THREE.AmbientLight( 0xFFFFFF );
    	scene.add(ambientlight);
    }
}

// Get the IP value from the textbox.
function setIP()
{	DATA_URL = document.getElementById("input_ip_address").value;
	console.log(DATA_URL);
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

// This function populates the "Available Sensors" List.
function populateList()
{
		// Get the (empty) list.
		var list = document.getElementById("hiddenSensors");

		// index is used to track the number of the sensor in the list.
		var index = 0;

		// the 'key in' takes all the objects under "sensors" in the data.
		for(var key in sensorJSON)
		{
			// Disabling wifi
			if(sensorJSON[key].type != "wifi")
			{
				// Don't add null values. (Note: even if the sensor changes from null to a value later, it won't be added)
				if(sensorJSON[key].values != null)
				{
					// Count the amount of axes available for the current sensor
					var axes = sensorJSON[key].values.length;
				} else 
				{
					var axes = 0;
				}

				// We create a list element for every axis.
				for(var i = 0; i < axes; i++)
				{
					// The sensorObject holds all data related to the actual sensor.
					var sensorObject = new SensorObject(index, i, key, sensorJSON[key].type);

					// The sensorList element is the representation of the sensorObject in the lists
					var sensorListElement = createListElement(index, sensorObject);
					list.appendChild(sensorListElement);

					// The array allSensors holds all sensorObjects and will not change later. 
					// This is used as a referance array.
					allSensors.push(sensorObject);
					// The hiddenSensors array holds a reference to the sensor.axis in allSensors
					hiddenSensors.push(sensorObject.value);
					index++;
				}
			}
		}
		$(function() 
		{
			// Here we connect the two lists together, so that items can be dragged between them.
			$('#hiddenSensors, #activeSensors').sortable({connectWith: '.sensorList'});
		});
}

// SensorObject object.
function SensorObject(index, i, k, type)
{
	this.value = index;
    this.sensorIndex = k;
	this.axisIndex = i;
    this.scale = [0, 0];
    this.r = Math.floor(Math.random()*255);
    this.g = Math.floor(Math.random()*255);
    this.b = Math.floor(Math.random()*255);
    this.color = new THREE.Color('rgb(' + this.r + ',' + this.g + ',' + this.b + ')');

    switch(i)
    {
    	case 0:
    	this.name = type + ".x";
    	break;
    	case 1:
    	this.name = type + ".y";
    	break;
    	case 2:
    	this.name = type + ".z";
    	break;
    	default:
    	this.name = type;
    }
}

// Here we create the element that represents the sensorObjects in the lists.
function createListElement(index, sObject)
{
	var listElement = document.createElement("li");
	listElement.value = index;
	listElement.id = index;
	listElement.ondblclick = function()
	{
		var parentNode = this.parentNode;
		var hidden = document.getElementById("hiddenSensors");
		var active = document.getElementById("activeSensors");
		parentNode.removeChild(this);
		if(parentNode == hidden){
			active.appendChild(this);
			updateWeb();
		} else{		
			hidden.appendChild(this);
			updateWeb();
		} 
	};

	var name = document.createElement("div");
	name.id = "name";
	name.innerHTML = sObject.name;
	listElement.appendChild(name);

	var colorpicker = document.createElement("input");
	colorpicker.type = "color";
	colorpicker.id = "colorinput";
	colorpicker.value = rgbToHex(sObject.r, sObject.g, sObject.b);
	listElement.appendChild(colorpicker);

	return listElement;
}

function start(){
	if(activeSensors.length >= 3){
		animate();
		updateWeb();
	} else 
	{
  		alert("Add at least 3 values");
  	}
}

// Converts RGB values to Hex values
function rgbToHex(r, g, b)
{
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Converts Hex values to RGB values
function hexToRgb(hex) 
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
    {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

//Map whatever value s between from[0] and from[1] to a value between 0 and 100.
function mapRange(from, s) 
{
	var to = [0, 100];
  	return to[0] + (Math.abs(s) - from[0]) * (to[1] - to[0]) / (from[1] - from[0]);
};

// Update the scaling factor in case value s is bigger than the existing scaling factor.
function recalculateScaling(sensor, s)
{
    if(s > sensor.scale[1])
    {
        sensor.scale[1] = s;
    }
}

// Update the web, and afterwards the order.
function updateWeb()
{
	// First we remove the old circles from the web.
	for(var i=0; i < webArr.length; i++)
	{
		scene.remove(webArr[i]);
	}
	webArr = [];

	// If we're not hiding the web, we will draw a new set of circles.
	if(webLocation != 0)
 	{	
 		updateOrder();
    	for(var i = 0; i < globalScale; i++)
    	{
 			var webGeo = new THREE.CircleGeometry( 100*i + 100, totalValues, 0, Math.PI * 2 );
 			var webMesh = new THREE.Mesh(webGeo, circleMaterial);

 				
 			webMesh.position = new THREE.Vector3( 0, 0, webLocation );
 			webArr.push(webMesh);
       		scene.add(webArr[i]);
    	}
    } else {
    	removeLabels();
    }
}

// Register the updated orders of the sensors. This is always called after the web is updated.
function updateOrder()
{
	removeLabels();

	// Here we get the items that are in both the Available Sensors and Active Sensors list.
	// This function is called when these lists have changed.
	var hidden = document.getElementById("hiddenSensors").getElementsByTagName('li');
	var active = document.getElementById("activeSensors").getElementsByTagName('li');

	// Empty the hiddenSensors array and fill with the new ones.
	// This is a good example on how we use the allSensor array as a 'backup'.
	// We don't change the array, we just check what is on which location 
	// and put it in the hiddenSensors array.
	hiddenSensors = [];
	for(var i = 0; i < hidden.length; i++)
	{
		hiddenSensors.push(allSensors[hidden[i].value].value);
	}

	// Empty the activeSensors array and fill it with the new updated list.
	activeSensors = [];
	for(var i = 0; i < active.length; i++)
	{
		activeSensors.push(allSensors[active[i].value].value);
		makeLabel(360/active.length * i -90,  allSensors[active[i].value].name);
	}

	// Update the totalValues to contain.. the total amount of values for the updated series.
	totalValues = activeSensors.length;
}

// This is triggered by the button under "Spiderweb" and switches between hiding the web,
// displaying it in the front, or displaying it in the back.
function changeWeb()
{
	if(webLocation == 0)
	{
		webLocation = -1;
		document.getElementById("hide_web").innerHTML = "Show in Front";
	} else if(webLocation == -1)
	{
		webLocation = 1;
		document.getElementById("hide_web").innerHTML = "Hide";
	} else
	{
		webLocation = 0;
		document.getElementById("hide_web").innerHTML = "Show in Back";
	}
	updateWeb();
}

// Making the labels
function makeLabel(angle, name)
{
	var label = document.createElement('div');
	label.className = "label";
	label.style.position = 'absolute';
	label.style.textAlign="left";
	label.style.width = 100;
	label.style.height = 100;
	label.innerHTML = name;
	var vector = new THREE.Vector3((420*Math.sin((-angle)* (Math.PI/180))), ( 420*Math.cos((-angle)* (Math.PI/180))), 0);

		if(toXYCoords(vector).x < size/2)
		{
			label.style.textAlign="right";
			label.style.top =	toXYCoords(vector).y + "px";
			label.style.left =  toXYCoords(vector).x - 120 + "px";
		} else 
		{
			label.style.top =	toXYCoords(vector).y + "px";
			label.style.left =  toXYCoords(vector).x + "px";
		}
	$('#spiderArea').append(label);
}

// Remove all elements with class .label.
function removeLabels()
{
	$('.label').remove();
}

// Convert 3D coordinates to XY coordinates
function toXYCoords (pos) 
{
	var projector = new THREE.Projector();
    var v = projector.projectVector(pos.clone(), camera);
    v.x = (v.x + 1)/2 * size;
    v.y = -(v.y - 1)/2 * size;
    return v;
}

// Update and animate the grap.
function animate()
{
	// Get the new data.
	var rawData = JSON.parse(httpGet(DATA_URL)).sensors;
	// Remove the old mesh
	scene.remove(mesh);
	// Arrays to hold the current and next color.
	// The next color is needed to draw the triangles with the correct colors.
	colorArr = [];
	nextColorArr=[];

	var offset = 0;

	var geometry = new THREE.Geometry();

	// For every active sensor, represented by totalValues, we draw a triangle.
	// The drawn triangle is built like this: A (Origin), B (Value for sensor) and C (value for next sensor).
	for(var i = 0; i < totalValues; i++)
	{
		var currentSensorValue = Math.abs(rawData[allSensors[activeSensors[i]].sensorIndex].values[allSensors[activeSensors[i]].axisIndex]);
		recalculateScaling(allSensors[activeSensors[i]], currentSensorValue);
		var mappedCurrentSensorValue = mapRange(allSensors[activeSensors[i]].scale, currentSensorValue);

		// A. A vertex on the origin
		geometry.vertices.push(new THREE.Vector3(0,0,0));

		// B. A vertex representing the value of the current sensor.
		geometry.vertices.push(new THREE.Vector3(
			globalScale * mappedCurrentSensorValue * Math.cos((offset)* (Math.PI/180)), 
			globalScale * mappedCurrentSensorValue * Math.sin((offset)* (Math.PI/180)),
			0
		));

		// Logic to loop around to 0.
		var j;
		if(i == totalValues-1)
		{
			j = 0;
			offset = 0;
		} else 
		{
			j = i+1;
			offset += 360 / totalValues;
		}

		var nextSensorValue = Math.abs(rawData[allSensors[activeSensors[j]].sensorIndex].values[allSensors[activeSensors[j]].axisIndex]);
		recalculateScaling(allSensors[activeSensors[j]], nextSensorValue);
		var mappedNextSensorValue = mapRange(allSensors[activeSensors[j]].scale, nextSensorValue);

		// C. A vertex representing the value of the next sensor.
		geometry.vertices.push(new THREE.Vector3(
			globalScale * mappedNextSensorValue * Math.cos((offset)* (Math.PI/180)), 
			globalScale * mappedNextSensorValue * Math.sin((offset)* (Math.PI/180)),
			0
		));
		
		// Create the triangle from the vertices.
		geometry.faces.push(new THREE.Face3(3*i, 3*i+1, 3*i+2));

		// get the colors.
		var newRGB = hexToRgb(document.getElementById(allSensors[activeSensors[i]].value).children[1].value);
		var nextRGB = hexToRgb(document.getElementById(allSensors[activeSensors[j]].value).children[1].value);
		
		allSensors[activeSensors[i]].color.setRGB(newRGB.r/255, newRGB.g/255, newRGB.b/255);
		
		color = allSensors[activeSensors[i]].color;
		nextColor = new THREE.Color('rgb(' + nextRGB.r + ',' + nextRGB.g + ',' + nextRGB.b + ')');
                
		colorArr.push(color);
		nextColorArr.push(nextColor);
	}
	
	geometry.computeFaceNormals();

	// Assign the colors to each vertex. Vertex "A" will be black.
	for(var i = 0; i < geometry.faces.length; i++)
	{
		geometry.faces[i].vertexColors[0] = new THREE.Color(0x000000);
		geometry.faces[i].vertexColors[1] = colorArr[i]; //c
		geometry.faces[i].vertexColors[2] = nextColorArr[i]; //b
	}

	//Set the Mesh
	mesh = new THREE.Mesh(geometry, graphMaterial);
	// Add the Mesh
	scene.add(mesh);
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function onWindowResize() 
{
	size = window.innerHeight - padding;

	$('#spiderArea').width(size).height(size);
	$('#settings').height(size + padding);
	$('.sensorList').height((size + padding)/2 - 130);
	renderer.setSize( size, size );

	updateOrder();
}

$(document).ready(function() 
{
	$('#hiddenSensors').bind('sortupdate', function(){ 	updateWeb()});
	window.addEventListener( 'resize', onWindowResize, false);
});
