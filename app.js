// app.js
// Project C: Bette Lights and Materials
//
// Created by Evan Bertis-Sample
// For CS 351 : Intro to Computer Graphics, Winter 2024
// Northwestern University
//

var g_idToElement = new Map(); // maps canvas ids to their respective webgl contexts
var g_elementToCanvas = new Map(); // maps canvas ids to their respective webgl contexts
var g_canvasToElement = new Map(); // maps webgl contexts to their respective canvas ids

var g_sceneGraph; // The scene graph for the application
var g_materialRegistry; // The material registry for the application
var g_meshRegistry; // The mesh registry for the application
var g_inputManager; // The input manager for the application
var g_ecs; // The entity component system for the application
var g_lightRegistry; // The lighting system for the application

// These buffers aren't actually sent to the GPU
// Rather, they are used to store the vertices, normals, and indices, then used create the buffers
var g_vertexArray = []; // The vertex buffer for the application
var g_normalArray = []; // The normal buffer for the application
var g_uvArray = []; // The uv buffer for the application

// These buffers are sent to the GPU
var g_vertexBufferID; // The vertex buffer for the application
var g_normalBuffer; // The normal buffer for the application

// update loop
var g_timeTracker = 0;
var g_timeElapsed = 0;
var g_deltaTime = 0;

async function main() {
	// Load the materials
	g_materialRegistry = new MaterialRegistry(c_MATERIALS, c_DEFAULT_SHADER_PARAMS);
	await g_materialRegistry.loadMaterials();
	console.log("Materials loaded");
	console.log(g_materialRegistry);
	// Load the meshes
	g_meshRegistry = new MeshRegistry();
	await g_meshRegistry.loadMeshes(c_MESHES);
	// initialize the input manager
	g_inputManager = new InputManager();
	g_inputManager.attach();

	g_lightRegistry = new LightingRegistry(c_LIGHTS)

	// add the terrain
	// let terrain = generateTerrainMesh(200, 200, 10, 10);
	// console.log(terrain)

	buildScene();

	let ids = c_WEBGL_IDS;
	for (let i = 0; i < ids.length; i++) {
		await initialize(ids[i]);
	}


	// register the cameras
	console.log("Registering cameras");
	console.log(c_CAMERAS);
	for (let [key, value] of c_CAMERAS) {
		let camera = new Camera(key, value);
		g_sceneGraph.addCamera(key, camera);
	}

	// add a listener to resize the cameras when the window is resized
	window.addEventListener('resize', function () {
		// console.log("Resizing cameras");
		for (let [key, value] of c_CAMERAS) {
			let camera = g_sceneGraph.getCamera(key);
			camera.resize();
		}

		// set the new viewports
		for (let [key, value] of g_elementToCanvas) {
			let canvas = document.getElementById(key);
			if (canvas == null) {
				console.log("Canvas is null");
				return;
			}
			let gl = value;
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
	});

	buildCamera()

	// update loop
	g_timeTracker = Date.now();
	g_timeElapsed = 0;
	g_ecs.start();

	let fpsCounter = document.getElementById("fps");
	let fps = 0;

	g_materialRegistry.setGlobalParam("u_time", 0)

	var tick = function () {
		let newTime = Date.now();
		g_deltaTime = (newTime - g_timeTracker) / 1000;
		g_timeTracker = newTime;
		g_ecs.update(g_deltaTime);
		g_inputManager.update();
		g_timeElapsed += g_deltaTime;
		for (let [key, value] of g_elementToCanvas) {
			drawAll(value);
		}
		g_lightRegistry.updateLights();
		g_materialRegistry.setGlobalParam("u_time", g_timeElapsed);
		
		fps = 1 / g_deltaTime;
		fpsCounter.innerHTML = "FPS: " + fps.toFixed(0);
	};

	// set up the lighting controls -- located in the html
	setupLightingControls()

	// tick();
	setInterval(tick, 1000 / 144);
}

// Initializes WebGL and the scene
// Grabs the global context and sets the viewport
// Loads the materials and meshes
// Builds the scene graph
// Initializes the input
async function initialize(canvasID) {
	// Retrieve the HTML-5 <canvas> element where webGL will draw our pictures
	console.log("Initializing WebGL for: " + canvasID);
	let canvasElement = document.getElementById(canvasID);

	if (canvasElement == null) {
		console.log("Canvas element is null");
		return;
	}

	gl = canvasElement.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
	// Handle failures
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL. Bye!');
		return;
	}
	// set the viewport to be sized correctly

	let width = canvasElement.scrollWidth;
	let height = canvasElement.scrollHeight;

	canvasElement.width = width / c_DOWNSAMPLE_FACTOR;
	canvasElement.height = height / c_DOWNSAMPLE_FACTOR;
	gl.viewport(0, 0, canvasElement.width, canvasElement.height);
	gl.clearColor(0.05, 0.08, 0.13, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT);
	// cull
	gl.enable(gl.CULL_FACE);

	loadMeshes(gl);

	// add the canvas to the map
	g_idToElement.set(canvasID, gl);
	g_elementToCanvas.set(canvasID, gl);
	g_canvasToElement.set(gl, canvasID);

}

function loadMeshes(gl) {
	// load the meshes into the buffers
	g_sceneGraph.traverse(loadMeshHelper);

	if (g_vertexArray.length == 0) {
		console.log("Vertex array is empty");
		return;
	}

	if (g_normalArray.length == 0) {
		console.log("Normal array is empty");
		return;
	}

	if (g_normalArray.length != g_vertexArray.length) {
		console.log("Vertex array and normal array are different lengths");
		return;
	}

	// interleave the vertex and normal arrays
	// sorted by vertex, normal, vertex, normal, etc.
	let interleavedArray = [];
	for (let i = 0; i < g_vertexArray.length; i++) {
		interleavedArray.push(g_vertexArray[i].elements[0]);
		interleavedArray.push(g_vertexArray[i].elements[1]);
		interleavedArray.push(g_vertexArray[i].elements[2]);
		interleavedArray.push(g_vertexArray[i].elements[3]);

		interleavedArray.push(g_normalArray[i].elements[0]);
		interleavedArray.push(g_normalArray[i].elements[1]);
		interleavedArray.push(g_normalArray[i].elements[2]);
		interleavedArray.push(g_normalArray[i].elements[3]);

		// only add the uv if it exists
		if (g_uvArray.length > i) {
			interleavedArray.push(g_uvArray[i].elements[0]);
			interleavedArray.push(g_uvArray[i].elements[1]);
		}
		else { // add a default uv
			interleavedArray.push(0);
			interleavedArray.push(0);
		}
	}

	// let vertexArray = vec4ArrayToFloat32Array(interleavedArray);
	let vertexArray = new Float32Array(interleavedArray);
	g_vertexBufferID = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBufferID);
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
}

function loadMeshHelper(node, modelMatrix) {
	if (node.renderInfo.mesh == "") {
		// console.log("Skipping node with no mesh");
		return;
	}

	// get the mesh
	let mesh = g_meshRegistry.getMesh(node.renderInfo.mesh);
	if (mesh == null) {
		// console.log("Mesh is null");
		return;
	}

	// load the mesh
	mesh.loadObject(g_vertexArray, g_normalArray, g_uvArray);
}

function drawAll(gl) {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Draw the scene graph
	g_sceneGraph.traverse(drawNode, gl);
}

function drawNode(node, modelMatrix, gl) {
	// draw the node
	// get the mesh and material from the node
	// get the model matrix from the node
	// draw the mesh with the material and model matrix
	let mesh = node.renderInfo.mesh;
	if (mesh == "") {
		// console.log("Mesh is null");
		return;
	}

	let material = node.renderInfo.material;
	if (material == "") {
		// console.log("Material is null");
		return;
	}

	// get the mesh
	mesh = g_meshRegistry.getMesh(node.renderInfo.mesh);
	if (mesh == null) {
		// console.log("Mesh is null");
		return;
	}

	// modelMatrix.printMe();
	// load the material
	let materialObject = g_materialRegistry.getMaterial(node.renderInfo.material);
	if (materialObject == null) {
		console.log("Material is null");
		return;
	}
	g_materialRegistry.setMaterial(node.renderInfo.material, gl);

	// get the element for the gl context
	let canvasID = g_canvasToElement.get(gl);
	if (canvasID == null) {
		console.log("Canvas ID is null");
		return;
	}

	// get the camera from the scene graph
	let camera = g_sceneGraph.getCamera(canvasID);

	if (camera == null) {
		console.log("Camera is null");
		return;
	}

	// pass the uniforms
	g_materialRegistry.passUniforms(gl, modelMatrix, camera.getViewMatrix(), camera.getProjectionMatrix(), camera.getPosition());

	// draw the mesh
	mesh.draw(gl);
}

function getAspectRatio(canvasID) {
	let canvas = document.getElementById(canvasID);
	if (canvas == null) {
		console.log("Canvas is null");
		return;
	}

	let aspect = canvas.scrollWidth / canvas.scrollHeight;
	// console.log("Aspect ratio: " + aspect);
	return aspect;
}