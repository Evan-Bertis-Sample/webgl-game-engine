// scene.js
// builds the scene graph

// builds the initial scene graph
function buildScene() {
	// Initialize the scene graph and ECS
	g_sceneGraph = new SceneGraph();
	g_ecs = new ECS(g_sceneGraph);

	buildEnviornment();
	buildRobot();
	buildCrystals();
	buildPlanet();
	console.log("Scene built");
}

function buildCamera() {
	// build the camera
	let cameraEntity = g_ecs.createEntity(
		entityName = "camera controller",
		parent = null,
		position = new Vector3([0, 40, 80]),
		rotation = new Quaternion().setFromAxisAngle(1, 0, 0, 30),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new CameraControllerComponent(
				"webgl", "Robot Parent",
				{
					movementSpeed: 30,
					offset: new Vector3([0, 30, 40]),
					originalRotation: new Quaternion().setFromAxisAngle(1, 0, 0, 30),
					rotationSpeed: 0.25,
				}
			),
		]
	);

	let lookAtObject = g_ecs.createEntity(
		entityName = "look_at_object",
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([10, 10, 10]),
		meshName = "sphere",
		materialName = "",
		components = [
			new FollowLookAtComponent(
				"webgl", 8
			),
			new LightComponent(
				LIGHT_TYPE.POINT,
				new Vector3([1.0, 0.0, 1.0]),
				new Vector3([1, 1, 1]),
				10
			)
		]
	);
}

function buildEnviornment() {
	// build the stars
	let numStars = 1000;
	let starRadius = 400;
	let minimumRadius = c_WALKABLE_RADIUS + 40;
	let starMaterial = "star";
	let starSizeVariation = 0.5;

	let starParent = g_ecs.createEntity(
		entityName = "star_parent",
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 0.5),
		]
	);

	for (let i = 0; i < numStars; i++) {
		let theta = Math.random() * 2 * Math.PI;
		let phi = Math.random() * 2 * Math.PI;
		let r = Math.random() * (starRadius - minimumRadius) + minimumRadius;
		let x = r * Math.sin(theta) * Math.cos(phi);
		let y = r * Math.sin(theta) * Math.sin(phi);
		let z = r * Math.cos(theta);
		let pos = new Vector3([x, y, z]);
		let size = Math.random() * starSizeVariation;
		let sizeVec = new Vector3([size, size, size]);

		let identifier = "star_" + i;
		let entity = buildStar(identifier, pos, sizeVec, starParent, starMaterial);
	}

	// build the dyson spheres
	let numSpheres = 10;
	let sphereRadius = c_WALKABLE_RADIUS + 20;
	let innerMaterial = "black_hole";
	let outerMaterial = "platform";
	let sphereScale = new Vector3([2, 2, 2]);

	let dysonParent = g_ecs.createEntity(
		entityName = "dyson_sphere_parent",
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 8),
		]
	);

	for (let i = 0; i < numSpheres; i++) {
		let theta = (i / numSpheres) * 2 * Math.PI;
		let pos = new Vector3([Math.cos(theta) * sphereRadius, 0, Math.sin(theta) * sphereRadius]);
		let identifier = "dyson_sphere_" + i;
		let entity = buildDysonSphere(identifier, pos, sphereScale, innerMaterial, outerMaterial, dysonParent);
	}

	// build the platform
	let platformScale = c_WALKABLE_RADIUS + 3;
	let platformEntity = g_ecs.createEntity(
		entityName = "platform",
		parent = null,
		position = new Vector3([0, -1.5, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([platformScale, platformScale, platformScale]),
		meshName = "platform",
		materialName = "platform",
		components = []
	);

	// build a crystal below the platform
	let crystalEntity = g_ecs.createEntity(
		entityName = "crystal_below_platform",
		parent = null,
		position = new Vector3([0, -60, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([10, 10, 10]),
		meshName = "crystal",
		materialName = "crystal_blue",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 100),
			new BobComponent(0.2, 5),
		]
	);

	// build a slowly spinning sphere at the origin
	let sphere = g_ecs.createEntity(
		entityName = "central_sphere",
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([7, 7, 7]),
		meshName = "low_poly_sphere",
		materialName = "center_sphere",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 10),
		]
	)
}

function buildStar(identifier, position, scale, parent, starMaterial) {
	let starEntity = g_ecs.createEntity(
		entityName = identifier,
		parent = parent,
		position = position,
		rotation = new Quaternion(),
		scale = scale,
		meshName = "low_poly_sphere",
		materialName = starMaterial,
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 5),
		]
	);

	return starEntity;
}

function buildDysonSphere(identifier, position, scale, innerMaterial, outerMaterial, parent) {
	let sphereEntity = g_ecs.createEntity(
		entityName = identifier,
		parent = parent,
		position = position,
		rotation = new Quaternion(),
		scale = scale,
		meshName = "low_poly_sphere",
		materialName = innerMaterial,
		components = [
			new ShakerComponent(2.5),
		]
	);

	let outerSphereEntity = g_ecs.createEntity(
		entityName = identifier + "_outer",
		parent = sphereEntity,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([2, 2, 2]),
		meshName = "gyro",
		materialName = outerMaterial,
		components = [
			new RotateComponent(new Vector3([1, 1, 1]), 30),
			new ShakerComponent(1.5),
		]
	);

	return sphereEntity;
}

function buildRobot() {
	let robotBaseEntity = g_ecs.createEntity(
		entityName = "Robot Parent",
		parent = null,
		position = new Vector3([0, 0, 25]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new BobComponent(0.2, 10),
			// new RotateComponent(new Vector3([0, 1, 0]), 0.1),
			new PlayerController(
				c_CONTROLS.MOVEMENT_AXIS_SET, c_PLAYER_MOVE_SPEED, c_PLAYER_ROT_SPEED, 20, new Quaternion().setFromAxisAngle(0, 1, 0, 45), c_WALKABLE_RADIUS,
			),
			new RobotLegOrchestratorComponent(
				[
					"robot_leg_0",
					"robot_leg_1",
					"robot_leg_2",
					"robot_leg_3",
				]
			),
		]
	);

	// add the head
	let robotHeadEntity = g_ecs.createEntity(
		entityName = "robot_head",
		parent = robotBaseEntity,
		position = new Vector3([0, 3, 0]),
		rotation = new Quaternion().setFromAxisAngle(1, 0, 0, 180),
		scale = new Vector3([1, 1, 1]),
		meshName = "robot_head",
		materialName = "robot_outers",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 100),
			new BobComponent(0.2, 5),
		]
	);

	// add a black hole to the head
	let blackHoleEntity = g_ecs.createEntity(
		entityName = "black_hole",
		parent = robotHeadEntity,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([0.5, 0.5, 0.5]),
		meshName = "low_poly_sphere",
		materialName = "black_hole_small",
		components = [
			new ShakerComponent(0.5),
			new LightComponent(
				LIGHT_TYPE.POINT,
				new Vector3([1.0, 0.0, 1.0]),
				new Vector3([1, 1, 1]),
				0.5
			)
		]
	);

	let robotInnersEntity = g_ecs.createEntity(
		entityName = "robot_inners",
		parent = robotBaseEntity,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "robot_cube_inners",
		materialName = "robot_inners",
		components = []
	);

	let robotOutersEntity = g_ecs.createEntity(
		entityName = "robot_outers",
		parent = robotBaseEntity,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "robot_cube_outers",
		materialName = "robot_outers",
		components = []
	);

	let robotVeinsEntity = g_ecs.createEntity(
		entityName = "robot_veins",
		parent = robotBaseEntity,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "robot_cube_veins",
		materialName = "robot_veins",
		components = []
	);

	// spawn robot legs
	let numLegs = 8;
	let groundY = -1.5;
	let segmentLength = 1;
	let segmentSize = 0.25;
	let legDistance = 2.5 + segmentSize;
	let segmentOffset = segmentLength / 2;

	for (let i = 0; i < numLegs; i++) {
		buildLeg(i, numLegs, legDistance, segmentLength, robotBaseEntity, groundY, segmentSize);
	}
}

function buildLeg(i, numLegs, legDistance, segmentLength, robotBaseEntity, groundY, segmentSize) {
	let theta = (i / numLegs) * 2 * Math.PI;
	let legPosition = new Vector3([Math.cos(theta) * legDistance, 0, Math.sin(theta) * legDistance]);
	let legRotation = new Quaternion();

	// ids for the leg components
	let legUpperID = "robot_leg_" + i + "_upper";
	let legLowerID = "robot_leg_" + i + "_lower";
	let pelvisID = "robot_leg_" + i + "_pelvis";
	let kneeID = "robot_leg_" + i + "_knee";
	let footIdealMarkerID = "robot_leg_" + i + "_foot_ideal_marker"; // used to mark the position of the foot for debugging
	let footActualMarkerID = "robot_leg_" + i + "_foot_actual_marker"; // used to mark the position of the foot for debugging
	let kneeActualMarkerID = "robot_leg_" + i + "_knee_actual_marker"; // used to mark the position of the foot for debugging

	let footPosOffset = legPosition.mul(segmentLength * 2);
	// create the leg
	let legBaseEntity = g_ecs.createEntity(
		entityName = "robot_leg_" + i,
		parent = robotBaseEntity,
		position = legPosition,
		rotation = legRotation,
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new RobotLegCompoent(
				legUpperID,
				legLowerID,
				pelvisID,
				kneeID,
				footPosOffset,
				groundY,
				1,
				segmentLength,
				segmentLength,
				footIdealMarkerID,
				footActualMarkerID,
				kneeActualMarkerID
			)
		]
	);

	// create the upper leg
	let upperLeg = g_ecs.createEntity(
		entityName = legUpperID,
		parent = null,
		position = new Vector3([0, 0.1, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([segmentSize, segmentLength / 2, segmentSize]),
		meshName = "cube",
		materialName = "robot_inners",
		components = [
			new RobotLegSegmentComponent(
				legBaseEntity.name,
				SEGMENT_TYPE.UPPER_LEG
			)
		]
	);

	// create the lower leg
	let lowerLeg = g_ecs.createEntity(
		entityName = legLowerID,
		parent = null,
		position = new Vector3([0, -1, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([segmentSize, segmentLength / 2, segmentSize]),
		meshName = "cube",
		materialName = "robot_outers",
		components = [
			new RobotLegSegmentComponent(
				legBaseEntity.name,
				SEGMENT_TYPE.LOWER_LEG
			)
		]
	);

	// create the pelvis
	let pelvis = g_ecs.createEntity(
		entityName = pelvisID,
		parent = legBaseEntity,
		position = legPosition.mul(-segmentSize).sub(new Vector3([0, 0.5, 0])),
		rotation = new Quaternion(),
		scale = new Vector3([segmentSize, segmentSize, segmentSize]),
		meshName = "low_poly_sphere",
		materialName = "robot_outers",
		components = []
	);

	// create the knee
	let kneePos = legPosition.mul(segmentLength * 4).add(new Vector3([0, 1, 0]));
	let knee = g_ecs.createEntity(
		entityName = kneeID,
		parent = pelvis,
		position = kneePos,
		rotation = new Quaternion(),
		scale = new Vector3([0.1, 0.1, 0.1]),
		meshName = "",
		materialName = "red",
		components = []
	);

	// create the ideal position marker
	g_ecs.createEntity(
		entityName = footIdealMarkerID,
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([0.1, 0.1, 0.1]),
		meshName = "",
		materialName = "red",
		components = []
	);

	// create the actual position marker
	g_ecs.createEntity(
		entityName = footActualMarkerID,
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([segmentSize, segmentSize, segmentSize]),
		meshName = "low_poly_sphere",
		materialName = "robot_outers",
		components = []
	);

	// create the knee actual position marker
	g_ecs.createEntity(
		entityName = kneeActualMarkerID,
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([segmentSize, segmentSize, segmentSize]),
		meshName = "low_poly_sphere",
		materialName = "robot_outers",
		components = []
	);
}

function buildArrows(parent) {
	if (parent == undefined || parent == null) {
		parent = g_ecs.createEntity(
			entityName = "arrow_parent",
			parent = null,
			position = new Vector3([0, 0, 0]),
			rotation = new Quaternion(),
			scale = new Vector3([4, 4, 4]),
			meshName = "",
			materialName = "",
			components = []
		);
	}

	// create the forward arrow
	let forwardArrow = g_ecs.createEntity(
		entityName = "forward_arrow",
		parent = parent,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion().setFromAxisAngle(1, 0, 0, -90),
		scale = new Vector3([1, 1, 1]),
		meshName = "arrow",
		materialName = "blue",
		components = []
	);

	// create the up arrow
	let upwardArrow = g_ecs.createEntity(
		entityName = "upward_arrow",
		parent = parent,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "arrow",
		materialName = "green",
		components = []
	);

	// create the right arrow
	let rightArrow = g_ecs.createEntity(
		entityName = "right_arrow",
		parent = parent,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion().setFromAxisAngle(0, 0, 1, -90),
		scale = new Vector3([1, 1, 1]),
		meshName = "arrow",
		materialName = "red",
		components = []
	);
}

function buildCrystals() {
	// build the crystals
	let numCrystalsPerLayer = 12;
	let layerRadii = [50];

	let crystalParent = g_ecs.createEntity(
		entityName = "crystal_parent",
		parent = null,
		position = new Vector3([0, 1, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 10),
		]
	);

	// build the crystals
	// such that they spiral outwards
	for (let i = 0; i < layerRadii.length; i++) {
		let radius = layerRadii[i];
		// calculate the offset for the spriral based on the radius
		let thetaOffset = radius * 0.5;
		let height = i * 5;

		for (let j = 0; j < numCrystalsPerLayer; j++) {
			let theta = (j / numCrystalsPerLayer) * 2 * Math.PI + thetaOffset;
			let x = Math.cos(theta) * radius;
			let z = Math.sin(theta) * radius;
			let y = height;
			let pos = new Vector3([x, y, z]);
			let scale = new Vector3([1, 1, 1]);
			let identifier = "crystal_" + i + "_" + j;
			let entity = buildCrystal(identifier, pos, scale, crystalParent);
		}
	}
}

function buildCrystal(identifier, position, scale, parent) {
	let crystalMaterials = [
		"crystal_blue",
		"crystal_purple",
		"crystal_pink",
	];

	// choose a random material
	let materialIndex = Math.floor(Math.random() * crystalMaterials.length);
	let material = crystalMaterials[materialIndex];

	// grab the color of the material
	let color = g_materialRegistry.getMaterial(material).getParam("u_color").value;
	console.log(color)

	let lightColor = new Vector3(color.elements)

	let crystalEntity = g_ecs.createEntity(
		entityName = identifier,
		parent = parent,
		position = position,
		rotation = new Quaternion(),
		scale = scale,
		meshName = "crystal",
		materialName = material,
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 100),
			new BobComponent(0.3, 5, true),
			new LightComponent(
				LIGHT_TYPE.POINT,
				lightColor,
				new Vector3([1, 1, 1]),
				1.5
			)
		]
	);

	// add 3 more crystals around the crystal
	let crystalOffset = 3;
	let crystalScale = 0.5;
	for (let i = 0; i < 3; i++) {
		let theta = (i / 3) * 2 * Math.PI;
		let x = Math.cos(theta) * crystalOffset;
		let z = Math.sin(theta) * crystalOffset;
		let y = 0;
		let pos = new Vector3([x, y, z]);
		let scale = new Vector3([crystalScale, crystalScale, crystalScale]);
		let identifier = "child_crystal_" + i + "_" + i;
		let entity = g_ecs.createEntity(
			entityName = identifier,
			parent = crystalEntity,
			position = pos,
			rotation = new Quaternion(),
			scale = scale,
			meshName = "crystal",
			materialName = material,
			components = [
				new RotateComponent(new Vector3([0, 1, 0]), 100),
			]
		);
	}

	return crystalEntity;
}

function buildPlanet(position) {
	let parentEntity = g_ecs.createEntity(
		entityName = "planet_parent",
		parent = null,
		position = new Vector3([0, 0, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([1, 1, 1]),
		meshName = "",
		materialName = "",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 10),
		]
	);

	let planetEntity = g_ecs.createEntity(
		entityName = "planet",
		parent = parentEntity,
		position = new Vector3([0, 0, 200]),
		rotation = new Quaternion(),
		scale = new Vector3([30, 30, 30]),
		meshName = "hex_sphere",
		materialName = "crystal_pink",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 4),
		]
	);

	// add a moon rotating around the planet
	let moonEntity = g_ecs.createEntity(
		entityName = "moon",
		parent = planetEntity,
		position = new Vector3([0, 0, 2]),
		rotation = new Quaternion(),
		scale = new Vector3([0.3, 0.3, 0.3]),
		meshName = "hex_sphere",
		materialName = "crystal_blue",
		components = [
			new RotateComponent(new Vector3([1, 0, 0]), 100),
		]
	);

	// add a moon rotating around the mooon
	let moonMoonEntity = g_ecs.createEntity(
		entityName = "moon_moon",
		parent = moonEntity,
		position = new Vector3([0, 2, 0]),
		rotation = new Quaternion(),
		scale = new Vector3([.5, .5, .5]),
		meshName = "hex_sphere",
		materialName = "crystal_purple",
		components = [
			new RotateComponent(new Vector3([0, 1, 0]), 0.5),
		]
	);
}