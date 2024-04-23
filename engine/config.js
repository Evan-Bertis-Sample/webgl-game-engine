// config.js
// holds the configuration for the application
// this includes the material descriptors, and meshes used

// Constants
var c_DOWNSAMPLE_FACTOR = 1; // The factor to downsample the screen by
var c_PLAYER_MOVE_SPEED = 10;
var c_PLAYER_ROT_SPEED = 10;
var c_CAMERA_SENSITIVITY = 5;
var c_WALKABLE_RADIUS = 60; // controls how far the player can move from the origin
var c_ENABLE_LIGHTING = 1.0; // 0.0 for no lighting, 1.0 for lighting

// WebGL Configuration
var c_WEBGL_IDS = ["webgl"]; // The id of the canvas elements

// camera configuration
// maps the camera id to a camera descriptor
var c_FAR_PLANE = 1000;
var c_CAMERAS = new Map([
	[
		"webgl", new CameraDescriptor(
			"webgl",
			new Vector3([0, 30, 40]),
			new Quaternion().setFromAxisAngle(1, 0, 0, 35),
			{
				mode: "perspective",
				allowDynamicReize: true,
				fov: 40,
				near: 1,
				far: c_FAR_PLANE,
			}
		)
	],
]);

// Debugging
var g_USE_FETCH = false; // Used to grab files via the fetch method, not usable using the file:// protocol

var c_LIGHTS = [
	new Light(
		LIGHT_TYPE.POINT,
		new Vector3([0.2, 0.0, 1.0]), // diffuse color
		new Vector3([1.0, 1.0, 1.0]), // specular color
		10.0,
		new Vector3([10.0, 15.0, 20.0])
	), // this is the light that the user has control over
	new Light(
		LIGHT_TYPE.DIRECTIONAL, 
		new Vector3([0.1, 0.0, 1.0]), 
		new Vector3([0.1, 0.1, 0.1]),
		0.1, 
		new Vector3([-1.0, -1.0, -1.0])
	),
];


var c_DEFAULT_SHADER_PARAMS = new Map([
	[
		"phong",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_shininess", 16.0),
			new MaterialParameter("u_diffuse_influence", 0.8),
			new MaterialParameter("u_specular_influence", 0.2),
			new MaterialParameter("u_frensel_influence", 0.1),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.0),
			new MaterialParameter("u_enable_lighting", c_ENABLE_LIGHTING),
			new MaterialParameter("u_show_grid", 0.0),
			new MaterialParameter("u_displacement_amplitude", 0.0),
			new MaterialParameter("u_displacement_frequency", 0.0),
		]
	],
	[
		"gouraud",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_shininess", 16.0),
			new MaterialParameter("u_diffuse_influence", 0.8),
			new MaterialParameter("u_specular_influence", 0.2),
			new MaterialParameter("u_frensel_influence", 0.1),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.0),
			new MaterialParameter("u_enable_lighting", c_ENABLE_LIGHTING),
			new MaterialParameter("u_show_grid", 0.0),
			new MaterialParameter("u_displacement_amplitude", 0.0),
			new MaterialParameter("u_displacement_frequency", 0.0),
		]
	],
	[
		"blinn-phong",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_shininess", 16.0),
			new MaterialParameter("u_diffuse_influence", 0.8),
			new MaterialParameter("u_specular_influence", 0.2),
			new MaterialParameter("u_frensel_influence", 0.1),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.0),
			new MaterialParameter("u_enable_lighting", c_ENABLE_LIGHTING),
			new MaterialParameter("u_show_grid", 0.0),
			new MaterialParameter("u_displacement_amplitude", 0.0),
			new MaterialParameter("u_displacement_frequency", 0.0),
		]
	],
	[
		"blinn-gouraud",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_shininess", 16.0),
			new MaterialParameter("u_diffuse_influence", 0.8),
			new MaterialParameter("u_specular_influence", 0.2),
			new MaterialParameter("u_frensel_influence", 0.1),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.0),
			new MaterialParameter("u_enable_lighting", c_ENABLE_LIGHTING),
			new MaterialParameter("u_show_grid", 0.0),
			new MaterialParameter("u_displacement_amplitude", 0.0),
			new MaterialParameter("u_displacement_frequency", 0.0),
		]
	],
	[
		"stylized",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_shininess", 16.0),
			new MaterialParameter("u_diffuse_influence", 0.8),
			new MaterialParameter("u_specular_influence", 0.2),
			new MaterialParameter("u_frensel_influence", 0.1),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.0),
			new MaterialParameter("u_enable_lighting", c_ENABLE_LIGHTING),
			new MaterialParameter("u_show_grid", 0.0),
			new MaterialParameter("u_displacement_amplitude", 0.0),
			new MaterialParameter("u_displacement_frequency", 0.0),
		]
	],

])

// Rendering Configuration
// Used by the MaterialRegistry to create materials
var c_MATERIALS = [
	new MaterialDescriptor(
		"gray",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.65, 0.65, 0.65, 1.0])),
			new MaterialParameter("u_specular_influence", 0.1),
			new MaterialParameter("u_shininess", 1.0)
		]
	),
	new MaterialDescriptor(
		"red",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([1.0, 0.0, 0.0, 1.0])),
			new MaterialParameter("u_specular_influence", 0.1),
			new MaterialParameter("u_shininess", 1.0)
		]
	),
	new MaterialDescriptor(
		"green",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 1.0, 0.0, 1.0])),
			new MaterialParameter("u_specular_influence", 0.1),
			new MaterialParameter("u_shininess", 1.0)
		]
	),
	new MaterialDescriptor(
		"blue",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_specular_influence", 0.1),
			new MaterialParameter("u_shininess", 1.0)
		]
	),
	new MaterialDescriptor(
		"center_sphere",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.8, 0.4, 0.6, 1.0])),
			new MaterialParameter("u_specular_influence", 3.5),
			new MaterialParameter("u_diffuse_influence", 1.0),
			new MaterialParameter("u_frensel_influence", 0.5),
			new MaterialParameter("u_frensel_border", 2.0),
			new MaterialParameter("u_frensel_color", new Vector4([0.8, 0.4, 0.6, 1.0])),
			new MaterialParameter("u_shininess", 64.0),
		]
	),
	new MaterialDescriptor(
		"robot_inners",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.5, 0.5, 0.5, 1.0])),
		]
	),
	new MaterialDescriptor(
		"robot_outers",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.7, 0.7, 0.7, 1.0])),
		]
	),
	new MaterialDescriptor(
		"robot_veins",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.8, 0.4, 0.6, 1.0])),
		]
	),
	new MaterialDescriptor(
		"black_hole_small",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 0.0, 0.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 0.0),
			new MaterialParameter("u_specular_influence", 0.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_displacement_amplitude", 0.2),
			new MaterialParameter("u_displacement_frequency", 100.5),
		]
	),
	new MaterialDescriptor(
		"black_hole",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 0.0, 0.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 0.0),
			new MaterialParameter("u_specular_influence", 0.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_displacement_amplitude", 0.5),
			new MaterialParameter("u_displacement_frequency", 10.5),
		]
	),
	new MaterialDescriptor(
		"black_hole_big",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 0.0, 0.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 0.0),
			new MaterialParameter("u_specular_influence", 0.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_displacement_amplitude", 1.5),
			new MaterialParameter("u_displacement_frequency", 100.5),
		]
	),
	new MaterialDescriptor(
		"star",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.7, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 1.0),
			new MaterialParameter("u_specular_influence", 0.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_border", 1.5),
		]
	),
	new MaterialDescriptor(
		"crystal_blue",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.0, 0.8, 1.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 1.0),
			new MaterialParameter("u_specular_influence", 2.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_shininess", 64.0),
		]
	),
	new MaterialDescriptor(
		"crystal_purple",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.3, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 1.0),
			new MaterialParameter("u_specular_influence", 2.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_shininess", 64.0),
		]
	),
	new MaterialDescriptor(
		"crystal_pink",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([0.7, 0.0, 1.0, 1.0])),
			new MaterialParameter("u_diffuse_influence", 1.0),
			new MaterialParameter("u_specular_influence", 2.0),
			new MaterialParameter("u_frensel_influence", 1.0),
			new MaterialParameter("u_frensel_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_frensel_border", 1.5),
			new MaterialParameter("u_shininess", 64.0),
		]
	),
	new MaterialDescriptor(
		"platform",
		"static/materials/phong",
		[
			new MaterialParameter("u_color", new Vector4([1.0, 1.0, 1.0, 1.0])),
			new MaterialParameter("u_show_grid", 1.0),
			new MaterialParameter("u_shininess", 128.0),
		]
	),
];

// Used by the MeshRegistry to create meshes
var c_MESHES = [
	"./static/meshes/cube.obj",
	"./static/meshes/invert_cube.obj",
	"./static/meshes/sphere.obj",
	"./static/meshes/invert_sphere.obj",
	"./static/meshes/robot.obj",
	"./static/meshes/robot_cube_inners.obj",
	"./static/meshes/robot_cube_outers.obj",
	"./static/meshes/robot_cube_veins.obj",
	"./static/meshes/floor_grout.obj",
	"./static/meshes/floor_tiles.obj",
	"./static/meshes/gyro.obj",
	"./static/meshes/platform.obj",
	"./static/meshes/plane.obj",
	"./static/meshes/arrow.obj",
	"./static/meshes/robot_head.obj",
	"./static/meshes/crystal.obj",
	"./static/meshes/hex_sphere.obj",
	"./static/meshes/low_poly_sphere.obj",
];


var c_CONTROLS = {
	MOVEMENT_AXIS_SET: AxisSets.WASD_KEYS,
	ROTATION_AXIS_SET: AxisSets.MOUSE_MOVEMENT,
}
