/*Sensorendipity Volumetric Visualization
* Author: Timo Bleeker
* Year: 2014
* Keio-NUS CUTE Center
* Singapore
*/

// webGL FPS box
var stats;

// Pointerlock controls
var controls;

// The time in milliseconds
var time = Date.now();

// Empty arrays for data
var oldData = [];
var	newData = [];

// Empty arrays for the checkboxes
var checkboxes = [];
var	checkboxesChecked = [];

// Scaling factors for sensors (not very accurate, picked by hand)
var scale = {
	accelerometer: 20,
	gyroscope: 20,
	gravity: 2 * 9.8,
	light: 1/10,
	magnetic: 5,
	proximity: 20,
	rotation_vector: Math.PI/2 * 100,
	linear_acceleration: 20,
	battery: 1/50,
	cell: 1,
	sound: 1/100,
	orientation: 1,
	time: 1,
	gps: 1,
	best_location_provider: 1,
	network_location_provider: 1,
	default_scale: 10
}

// Total sensor values.
var totalValues = 0;

// Every iteration is a data measurement.
var iteration = 0;
var max_iterations = 50;

// Z offset per iteration
var offset = 50;

// Mesh and material
var mesh;
var material;

//final geometry
var finalGeo;

// Set the scene size
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

// Set camera attributes
var VIEW_ANGLE = 45;
var	ASPECT = WIDTH / HEIGHT;
var	NEAR = 0.1;
var	FAR = 10000;

// Create a WebGL renderer
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( WIDTH, HEIGHT );

// Create the camera
var camera = new THREE.PerspectiveCamera(  
	VIEW_ANGLE,
	ASPECT,
	NEAR,
	FAR);

// Create the scene
var scene = new THREE.Scene();

window.addEventListener( 'resize', onWindowResize, false);

// Initialize function. This happens on pressing the "Connect button"
function init()
{
    // Connect to server;
    setIP();

    // Try to get the initial data of the server. If the IP is incorrect, this gives a pop-up.
    try
    {
    	var sensorJSON = JSON.parse(httpGet(DATA_URL)).sensors;
    	// Disable the Connect button after it has been pressed, to make sure the init() function only runs once.
		document.getElementById("button_connect").disabled = true;
    } catch(e)
    {
    	alert("Invalid IP address");
    }

    if(sensorJSON != null)
    {	
		// Find all sensors and and the axis, and create checkboxes.
		var keys = {};
		for(var key in sensorJSON)
		{
			if(sensorJSON[key].type != "wifi")
			{
				if(sensorJSON[key].values != null)
				{
					keys[key] = sensorJSON[key].values;
					checkboxes.push(new Checkbox(key, keys[key], sensorJSON[key].type));
				}
			}
		}

		// The blocker is a div shown on top of the visualization when the mouse is not locked.
		var blocker = document.getElementById( 'blocker' );
		var instructions = document.getElementById( 'instructions' );

		// This checks whether the browser suppoers pointerlock, then runs createPointerLockControls if its supported
		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

		if ( havePointerLock ) 
		{
			createPointerLockControls();
		} else 
		{
			instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
		}

		document.getElementById("button_start").disabled = false;

		// Add the camera to the scene
		camera.position.set(0,0,0);
		scene.add(camera);

  		// Attach the render-supplied DOM element
  		// get the DOM element to attach to
		$('#container').append(renderer.domElement);

  		//create the control object. We're the camera to the controls, and translating them away from the origin, so we see the scene when it gets rendered.
  		controls = new THREE.PointerLockControls( camera );
  		controls.getObject().translateX(800);
  		controls.getObject().translateY(400);
  		controls.getObject().translateZ(400);
  		controls.setInitialRotation(-20 * (Math.PI/180), 40* (Math.PI/180));
  		scene.add( controls.getObject() );

  		// The axis helper shows the default xyz axis. Used for debugging. Uncomment "scene.add( helper );" to show it.
  		helper = new THREE.AxisHelper( 100 );
  		helper.position.set(0,0,0);
  		//scene.add( helper );

  		// Create the material for the mesh.
  		material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, wireframe: false, transparent: false, opacity: 0.5, side: THREE.DoubleSide, vertexColors:THREE.VertexColors } );

  		// Add lightning to the scene.
  		addLightning();

  		// Create the FPS info element
  		stats = new Stats();
  		stats.domElement.style.position = 'relative';
  		stats.domElement.style.float = "right";
  		document.getElementById("settings").appendChild( stats.domElement );

  	}
}


// Big long function to create pointerlock controls. Taken from Three.js examples. Not related to how the visualization works.
function createPointerLockControls()
{
	var element = document.body;
	var pointerlockchange = function ( event ) 
	{
		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) 
		{
			controls.enabled = true;
			blocker.style.display = 'none';
		} else 
		{
			controls.enabled = false;
			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';
			instructions.style.display = '';
		}
	}
	var pointerlockerror = function ( event ) 
	{
		instructions.style.display = '';
	}
			// Hook pointer lock state change events
			document.addEventListener( 'pointerlockchange', pointerlockchange, false );
			document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
			document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

			document.addEventListener( 'pointerlockerror', pointerlockerror, false );
			document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
			document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

			instructions.addEventListener( 'click', function ( event ) 
			{
				instructions.style.display = 'none';

				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

				if ( /Firefox/i.test( navigator.userAgent ) ) 
				{
					var fullscreenchange = function ( event ) 
					{
						if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) 
						{
							document.removeEventListener( 'fullscreenchange', fullscreenchange );
							document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
							element.requestPointerLock();
						}
					}
					document.addEventListener( 'fullscreenchange', fullscreenchange, false );
					document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
					element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
					element.requestFullscreen();
				} else 
				{
					element.requestPointerLock();
				}
			}, false );
}

//This is called when the Start button is pressed, and will clear certain values and start a new render.
  function start(){

  	// Get the number of max iterations from the inputfield.
  	max_iterations = document.getElementById("input_quantity").value;
  	// Clear some data
  	iteration = 0;
  	oldData.length = 0;
  	newData.length = 0;
  	totalValues = 0;

  	// Find checked checkboxes
  	checkboxesChecked.length = 0;
  	for (var i=0; i < checkboxes.length; i++)
  	{
  		if(checkboxes[i].sensor_checkbox.checked){
  			checkboxesChecked.push(checkboxes[i]);
  			totalValues += checkboxes[i].secondary;
  		}
  	}
  	//Make sure a sensor with at least three values has been added, otherwise alert.
  	if(totalValues >= 3){
  	// Resize the arrays and fill with 0's
  	for(var i = 0; i < checkboxesChecked.length; i++)
  	{
  		oldData[i] = [];
  		newData[i] = [];
  		for(var j = 0; j < checkboxesChecked[i].secondary; j++)
  		{
  			oldData[i][j] = 0;
			newData[i][j] = 0;
		}
  	}
  	animate();
  } else 
  {
  	alert("Add at least 3 values");
  }
}

// Create checkboxes and descriptions
function Checkbox(type, axes, name)
{
	this.primary = type;
	this.secondary = axes.length;
	this.name = name;

	this.label = document.createElement("label");
	this.desc = document.createTextNode(this.name + " | ");
	this.sensor_checkbox = document.createElement("input");
	this.sensor_checkbox.type = "checkbox";
	this.sensor_checkbox.value = this.primary;
	this.label.appendChild(this.sensor_checkbox);
	this.label.appendChild(this.desc);
	document.getElementById("settings").appendChild(this.label);
}
//-----animate------//
function animate(){
	
	if(iteration < max_iterations)
	{
		update();
		createMesh();
		iteration++;
	} else 
	{
		document.getElementById("exporter").disabled = false;
	}

	requestAnimationFrame(animate);

	controls.update( Date.now() - time );
	render();
	stats.update();
	time = Date.now();
}

function render()
{
	renderer.render(scene, camera);
}

function update()
{
	var rawData = JSON.parse(httpGet(DATA_URL)).sensors;

	var scaling;
	// This loop sets the previous measurment to the oldData and the current measurement
	// to the newData. We need both to create a closed mesh.
	for (var i=0; i < checkboxesChecked.length; i++)
	{
		var dataType = checkboxesChecked[i].primary;
		var axis = checkboxesChecked[i].secondary;

		if(scale.hasOwnProperty(checkboxesChecked[i].name))
		{
			scaling = scale[checkboxesChecked[i].name];
			
		} else 
		{
			scaling = scale["default_scale"];
		}
		for(var j=0; j < axis; j++)
		{
			oldData[i][j] = newData[i][j];
			newData[i][j] = Math.abs(rawData[dataType].values[j] * scaling);			
		} 		
	} 
}
// Get the IP value from the textbox.
function setIP()
{
	DATA_URL = document.getElementById("input_ip_address").value;
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

function addLightning()
{
	// Create ambient light
	var ambientlight = new THREE.AmbientLight( 0x999999 );

  	// Create a directional light
	var directionLight = new THREE.DirectionalLight(0xFFFFFF);
	directionLight.position.set(1,1,0);

  	// add lights to the scene
  	scene.add(ambientlight);
  	scene.add(directionLight);
}

function createMesh()
{
  	// This creates 2 triangles for every measured value. 
  	// We need the old values to connect the new values to the previous mesh.  
  	var geometry;

  	// Angle of seperation
	var angle = 360 / totalValues;
  	var angle_offset = 0;

  	for(var i = 0; i < checkboxesChecked.length; i++)
  	{
  		// Amount of values for a the sensor
  		var axis = checkboxesChecked[i].secondary;

  		for(var j = 0; j < axis; j++)
  		{
  			var next = [];
  			var next_angle_offset = angle_offset + 1;

			// If we reach the last value, we need to connect to the first value
			if(next_angle_offset == totalValues)
			{
				next_angle_offset = 0;
			}
			if(angle_offset == totalValues)
			{
				angle_offset = 0;
			}

			// Strange construction to make sure the "next" values are correct and match up.
			if(j < axis - 1)
			{
				next = [i, j + 1];
			} else if(j == axis - 1 && angle_offset < totalValues -1)
			{
				next = [i + 1, 0];
			} else if(angle_offset == totalValues - 1)
			{
				next = [0,0];
			}

		// We can't change the size of a buffer, so we need to remove the mesh, and later add a new merged mesh.
		scene.remove(mesh);

		geometry = new THREE.Geometry();
			// Create the two triangles.
			geometry.vertices.push(new THREE.Vector3( Math.cos((angle * angle_offset)* (Math.PI/180))*oldData[i][j], Math.sin((angle * angle_offset) * (Math.PI/180))*oldData[i][j], -offset  * iteration)); 
			geometry.vertices.push(new THREE.Vector3( Math.cos((angle * angle_offset)* (Math.PI/180))*newData[i][j], Math.sin((angle * angle_offset) * (Math.PI/180))*newData[i][j], -offset  * (iteration + 1)));
			geometry.vertices.push(new THREE.Vector3( Math.cos((angle * next_angle_offset) * (Math.PI/180))*oldData[next[0]][next[1]], Math.sin((angle * next_angle_offset) * (Math.PI/180))*oldData[next[0]][next[1]], -offset  * iteration));
			geometry.faces.push( new THREE.Face3(0,1,2));

			geometry.vertices.push(new THREE.Vector3( Math.cos((angle * next_angle_offset)* (Math.PI/180))*oldData[next[0]][next[1]] , Math.sin((angle * next_angle_offset) * (Math.PI/180))*oldData[next[0]][next[1]] ,-offset* iteration)); 
			geometry.vertices.push(new THREE.Vector3( Math.cos((angle * angle_offset)* (Math.PI/180))*newData[i][j], Math.sin((angle * angle_offset) * (Math.PI/180))*newData[i][j] , -offset * (iteration + 1))); 
			geometry.vertices.push(new THREE.Vector3(Math.cos((angle * next_angle_offset)* (Math.PI/180))*newData[next[0]][next[1]] , Math.sin((angle * next_angle_offset) * (Math.PI/180))*newData[next[0]][next[1]] ,-offset * (iteration + 1))); 
			geometry.faces.push( new THREE.Face3(3, 4, 5));

			geometry.computeFaceNormals();

			// Automatically assign the right HSL color to the points
			var color = new THREE.Color();
			color.setHSL(1/360 * (angle * angle_offset), 1.0, .5);
			geometry.faces[0].vertexColors[0] = color;
			geometry.faces[0].vertexColors[1] = color;
			geometry.faces[1].vertexColors[1] = color;
			color = new THREE.Color();
			color.setHSL(1/360 * (angle * (angle_offset + 1)), 1.0, .5);
			geometry.faces[0].vertexColors[2] = color;
			geometry.faces[1].vertexColors[0] = color;
			geometry.faces[1].vertexColors[2] = color;

			//Create a new mesh from scratch if it's the first one, otherwise merge it with the old first
			if(iteration == 0 && i == 0 && j == 0)
			{
				mesh = new THREE.Mesh(geometry, material);
			} else
			{
				THREE.GeometryUtils.merge(geometry, mesh);
				mesh = new THREE.Mesh(geometry, material);
			}
			scene.add(mesh);
			angle_offset++;
	}
}
			finalGeo = geometry;
}

function onWindowResize() 
{
	var $settings = $("#settings");
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function resetCamera()
{
  	controls.getObject().position.x = 800;
  	controls.getObject().position.y = 400;
  	controls.getObject().position.z = 400;
  	controls.setInitialRotation(-20 * (Math.PI/180), 40* (Math.PI/180));
}

// Switch between wireframe and solid material looks
function switchMaterial()
{
	if(!material.wireframe)
	{
		material.wireframe = true;
	} else 
	{
		material.wireframe = false;
	}
}

//Export to OBJ data. Rename resulting file to foo.obj and import in Blender or another tool.
function exporter()
{
	var exported = new THREE.OBJExporter().parse(finalGeo);

    var blob = new Blob([exported], {type: "application/octet-stream"});
    var url  = window.URL.createObjectURL(blob);
  	window.location=url;

  	document.getElementById("exporter").disabled = true;
}