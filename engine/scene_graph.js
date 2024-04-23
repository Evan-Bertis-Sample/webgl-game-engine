// scene_graph.js
// A simple implementation of a scene graph
// Used to store the scene graph for the application

// A representation of a Transform in the scene graph
// Stores the position, rotation, and scale of the transform
class Transform {
    // Creates a new transform from the given position, rotation, and scale
    // position: a Vector3 representing the position of the transform
    // rotation: a Quaternion representing the rotation of the transform
    // scale: a Vector3 representing the scale of the transform
    constructor(position = null, rotation = null, scale = null, parent) {
        if (position == null) {
            position = new Vector3([0, 0, 0]);
        }

        if (rotation == null) {
            rotation = new Quaternion();
        }

        if (scale == null) {
            scale = new Vector3([1, 1, 1]);
        }

        this.position = position;
        this.worldPosition = position;
        this.rotation = rotation;
        this.scale = scale;
        this.parent = parent;
    }

    getWorldModelMatrix() {
        let modelMatrix = this.getLocalModelMatrix();
        if (this.parent == null) {
            // console.log("No parent");
            return modelMatrix;
        }

        let parentModelMatrix = this.parent.getWorldModelMatrix();
        let parentModelMatrixCopy = new Matrix4().set(parentModelMatrix);
        let worldModelMatrix = parentModelMatrixCopy.multiply(modelMatrix);
        return worldModelMatrix;
    }

    // Returns the model matrix for this transform
    getLocalModelMatrix() {
        // console.log("Local Model Matrix:");
        this.rotation.normalize();
        let rotationMatrix = new Matrix4().setFromQuat(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w);
        // console.log("Rotation Matrix:");
        // rotationMatrix.printMe();

        let scaleMatrix = new Matrix4().setScale(this.scale.elements[0], this.scale.elements[1], this.scale.elements[2]);
        // console.log("Scale Matrix:");
        // scaleMatrix.printMe();

        let translationMatrix = new Matrix4().setTranslate(this.position.elements[0], this.position.elements[1], this.position.elements[2]);
        // console.log("Translation Matrix:");
        // translationMatrix.printMe();

        // scale, then rotate, then translate
        // translationMatrix * rotationMatrix * scaleMatrix
        let modelMatrix = translationMatrix.multiply(rotationMatrix.multiply(scaleMatrix));
        // console.log("Model Matrix:");
        // modelMatrix.printMe();
        return modelMatrix;
    }

    // Sets the position of this transform
    // position: a Vector3 representing the position of the transform
    setPosition(position) {
        this.position = position;
    }

    // Sets the rotation of this transform
    // rotation: a Quaternion representing the rotation of the transform
    setRotation(rotation) {
        this.rotation = rotation;
    }

    // Sets the rotation of this transform
    // pitch: the pitch of the rotation in degrees
    // yaw: the yaw of the rotation in degrees
    // roll: the roll of the rotation in degrees
    setRotationFromEulerAngles(pitch, yaw, roll) {
        this.rotation.setFromEuler(pitch, yaw, roll);
    }

    // Sets the rotation of this transform from a rotation matrix
    // rotationMatrix: a 4x4 rotation matrix
    setRotationFromMatrix(rotationMatrix) {
        this.rotation.setFromRotationMatrix(rotationMatrix);
    }

    // Sets the roation of this transform from an axis-angle representation
    // axis: a Vector3 representing the axis of rotation
    // angle: the angle of rotation in degrees
    setRotationFromAxisAngle(axis, angle) {
        this.rotation.setFromAxisAngle(axis.x, axis.y, axis.z, angle);
    }

    // Gets the world position of this transform
    getWorldPosition() {
        // get the model matrix
        let modelMatrix = this.getWorldModelMatrix();
        // get the world position
        let worldPosition = modelMatrix.multiplyVector4(new Vector4([0, 0, 0, 1]));

        // convert to a Vector3
        worldPosition = new Vector3([worldPosition.elements[0], worldPosition.elements[1], worldPosition.elements[2]]);
        return worldPosition;
    }

    // Gets the world rotation of this transform
    getWorldRotation() {
        // get the model matrix
        let modelMatrix = this.getWorldModelMatrix();
        // get the world rotation
        let worldRotation = new Quaternion();
        worldRotation.setFromRotationMatrix(modelMatrix);
        return worldRotation;
    }


}

// A representation of a GameObject in the scene graph
// Stores the transform, mesh, and material of the game object
class RenderInfo {
    // Creates a new RenderInfo
    // material: the material to use for rendering the mesh
    // mesh: the mesh to use for rendering
    constructor(material, mesh) {
        if (material == null) {
            material = "NONE";
        }
        if (mesh == null) {
            mesh = "NONE";
        }
        this.material = material;
        this.mesh = mesh;
        this.bufferID = null;
    }

    // Sets the material of this RenderInfo
    // material: the material to use for rendering the mesh -- name of the material
    setMaterial(material) {
        this.material = material;
    }

    // Sets the mesh of this RenderInfo
    // mesh: the mesh to use for rendering
    setMesh(mesh) {
        this.mesh = mesh;
    }
}

// A node in the scene graph
// Stores the render info and transform of the node
class SceneNode {
    // Creates a new SceneNode
    // renderInfo: the RenderInfo to use for rendering this node
    // transform: the Transform to use for rendering this node
    constructor(renderInfo, transform) {
        if (renderInfo == null) {
            renderInfo = new RenderInfo(null, null);
        }
        if (transform == null) {
            transform = new Transform();
        }
        this.renderInfo = renderInfo;
        this.transform = transform;
        this.children = [];
        this.parent = null;
    }

    // Sets the parent of this SceneNode
    // parent: the parent to use for this SceneNode
    setParent(parent) {
        this.parent = parent;
        this.transform.parent = parent.transform;
    }

    // Sets the render info of this SceneNode
    // renderInfo: the RenderInfo to use for rendering this node
    setRenderInfo(renderInfo) {
        this.renderInfo = renderInfo;
    }

    // Sets the transform of this SceneNode
    // transform: the Transform to use for rendering this node
    setTransform(transform) {
        this.transform = transform;
    }

    // Adds children to this SceneNode
    // children: the children to add to this SceneNode
    // returns the SceneNode
    addChildren(children) {
        for (var i = 0; i < children.length; i++) {
            this.addChild(children[i]);
        }
        return this;
    }

    // Adds a child to this SceneNode
    // child: the child to add to this SceneNode
    // returns the child so you can nest addChildren calls
    addChild(child) {
        child.setParent(this);
        this.children.push(child);
        return child;
    }

    // Removes a child from this SceneNode
    // child: the child to remove from this SceneNode
    removeChild(child) {
        this.children = this.children.filter(function (value, index, arr) {
            return value != child;
        });

        child.parent = null;
    }

    // Returns the model matrix for this SceneNode
    // Note : This is a decently expensive operation, so use sparingly, especially if the scene graph is large
    // It is best to traverse the scene graph and use the model matrix of the node you are currently on
    getModelMatrix() {
        if (this.parent == null) {
            return this.transform.getModelMatrix();
        } else {
            return this.parent.getModelMatrix().multiply(this.transform.getModelMatrix());
        }
    }
}

class CameraDescriptor {
    constructor(canvasID, position, rotation, { mode = "perspective", allowDynamicResize = true, fov = 35, near = 1, far = 1000, left = -50, right = 50, top = 50, bottom = -50, linkTo = null }) {
        this.canvasID = canvasID;
        this.position = position;
        this.rotation = rotation;

        this.allowDynamicResize = allowDynamicResize;
        this.mode = mode;
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.linkTo = linkTo;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }

    getProjectionMatrix() {
        if (this.mode == "perspective") {
            return new Matrix4().setPerspective(this.fov, getAspectRatio(this.canvasID), this.near, this.far);
        }

        if (this.mode == "orthographic") {
            if (this.linkTo == null) {
                return new Matrix4().setOrtho(this.left, this.right, this.bottom, this.top, this.near, this.far);
            }

            // link to another camera
            console.log("Linking to another camera");
            let cameraName = this.linkTo[0];
            let depthFactor = this.linkTo[1];

            // grab the camera descriptor
            let cameraDescriptor = c_CAMERAS.get(cameraName);
            if (cameraDescriptor.mode == "orthographic")
            {
                console.log("Error: Cannot link to an orthographic camera");
                return new Matrix4().setOrtho(this.left, this.right, this.bottom, this.top, this.near, this.far);
            }

            // now we should create a new orthographic projection matrix
            // where the bounds are the same as the linked perspective camera
            // at the given depth
            let depth = (cameraDescriptor.far - cameraDescriptor.near) * depthFactor;
            let frustrumHeight = Math.tan(cameraDescriptor.fov * Math.PI / 180.0) * depth;
            let frustrumWidth = frustrumHeight * getAspectRatio(this.canvasID);

            let left = -frustrumWidth / 2;
            let right = frustrumWidth / 2;
            let bottom = -frustrumHeight / 2;
            let top = frustrumHeight / 2;
            let near = cameraDescriptor.near;
            let far = cameraDescriptor.far + depth;

            return new Matrix4().setOrtho(left, right, bottom, top, near, far);
        }

        console.log("Error: Invalid camera mode");
    }
}

class Camera {
    constructor(canvasID, descriptor) {
        // get the canvas
        this.canvasID = canvasID;
        this.canvasElementID = g_idToElement.get(canvasID);
        this.gl = g_elementToCanvas.get(this.canvasElementID);
        this.descriptor = descriptor;

        this.position = descriptor.position;
        this.rotation = descriptor.rotation;
        this.projectionMatrix = new Matrix4().set(descriptor.getProjectionMatrix());
        
    }

    resize() {
        if (this.descriptor.allowDynamicResize) {
            console.log("Resizing camera");
            // now reconstruct the projection matrix such that the aspect ratio is correct
            // we are assuming that the projection matrix is a perspective matrix
            this.projectionMatrix.set(this.descriptor.getProjectionMatrix());
        }
    }

    getViewMatrix() {
        let viewMatrix = new Matrix4();
        viewMatrix.setFromQuat(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w);
        viewMatrix.translate(-this.position.elements[0], -this.position.elements[1], -this.position.elements[2]);
        return viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    getPosition() {
        return this.position;
    }

    setPosition(position) {
        this.position = position;
    }

    setRotation(rotation) {
        this.rotation = rotation;
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    setRotationFromEulerAngles(pitch, yaw, roll) {
        this.rotation.setFromEuler(pitch, yaw, roll);
    }

    setRotationFromMatrix(rotationMatrix) {
        this.rotation.setFromRotationMatrix(rotationMatrix);
    }

    setRotationFromAxisAngle(axis, angle) {
        this.rotation.setFromAxisAngle(axis.x, axis.y, axis.z, angle);
    }

    isInViewFrustrum(node, modelMatrix)
    {
        // do some basic object culling
        // looked into this initially for the project, but didn't have time to implement it
    }

    getLookAtPosition(distance)
    {
        // get the position that the camera is looking at
        let rotationMatrix = new Matrix4();
        rotationMatrix.setFromQuat(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w);
        let direction = new Vector4([0, 0, distance, 0])

        let lookAt = rotationMatrix.multiplyVector4(direction);
        lookAt = new Vector3([lookAt.elements[0], lookAt.elements[1], lookAt.elements[2]]);

        // add to the position
        let position = this.position;
        lookAt = lookAt.add(position);

        // lookAt.printMe();
        return lookAt;
    }
}


// A representation of a scene graph
// Stores the root node of the scene graph
class SceneGraph {
    // Creates a new SceneGraph
    // root: the root node of the scene graph
    constructor() {
        this.root = new SceneNode(null, new Transform());
        this.projectionMatrix = new Matrix4();
        this.cameras = new Map();
    }

    // Traverses the scene graph
    // callback: the function to call on each node, takes in a TransformNode, and the model matrix of the node
    traverse(callback, gl) {
        // push an identity matrix to the matrix stack
        // this is the model matrix of the root node
        let identityMatrix = new Matrix4();
        this._traverseHelper(this.root, callback, gl, identityMatrix, 0);
    }

    // Helper function for traversing the scene graph
    // node: the node to traverse
    // callback: the function to call on each node, takes in a TransformNode, and the model matrix of the node
    // parentModelMatrix: the model matrix of the parent node
    _traverseHelper(node, callback, cl, parentModelMatrix, depth) {
        let worldPos = parentModelMatrix.multiplyVector3(node.transform.position)
        node.transform.worldPosition = worldPos;

        
        let localModelMatrix = node.transform.getLocalModelMatrix();
        let modelMatrix = parentModelMatrix.multiply(localModelMatrix);

        // console.log("Depth: " + depth);
        // console.log(node);
        // modelMatrix.printMe();
        callback(node, modelMatrix, cl);
        for (var i = 0; i < node.children.length; i++) {
            let modelMatrixCopy = new Matrix4().set(modelMatrix)
            this._traverseHelper(node.children[i], callback, cl, modelMatrixCopy, depth + 1);
        }
    }

    addCamera(glElementID, camera) {
        this.cameras.set(glElementID, camera);
    }

    getCamera(glElementID) {
        return this.cameras.get(glElementID);
    }

    // Adds children to the scene
    // NOTE: as of now, the children are added to the camera node -- this will probably change in the future
    // object : the scenenode to add to the scene
    // returns the SceneNode
    addObjects(children) {
        this.root.addChildren(children);
        return this;
    }

    // Adds a child to the scene
    // NOTE: as of now, the child is added to the camera node -- this will probably change in the future
    // child: the child to add to the scene
    // returns the child so you can nest addChildren calls
    addObject(child) {
        this.root.addChild(child);
        return child;
    }

    // Prints the scene graph to the console
    print() {
        console.log("Scene Graph:");
        this._printHelper(this.root, 0);
    }

    // Helper function for printing the scene graph
    // node: the node to print
    // depth: the depth of the node in the scene graph
    _printHelper(node, depth) {
        let indent = "";
        for (var i = 0; i < depth; i++) {
            indent += "    ";
        }
        console.log(indent + "Node:");
        console.log(indent + "    RenderInfo:");
        console.log(indent + "        Material: " + node.renderInfo.material);
        console.log(indent + "        Mesh: " + node.renderInfo.mesh);
        console.log(indent + "    Transform:");
        console.log(indent + "        Position: " + node.transform.position.elements);
        console.log(indent + "        Rotation: " + "x : " + node.transform.rotation.x + ", y : " + node.transform.rotation.y + ", z : " + node.transform.rotation.z + ", w : " + node.transform.rotation.w);
        console.log(indent + "        Scale: " + node.transform.scale.elements);
        for (var i = 0; i < node.children.length; i++) {
            this._printHelper(node.children[i], depth + 1);
        }
    }
}

// Some helper functions for the scene graph
// These functions are used to create the scene graph

// Creates a new SceneNode with the given mesh, materials, and position, scale, and rotation
// meshName: the mesh to use for rendering this node : name of the mesh
// materialName: the material to use for rendering this node : name of the material
// position: the position of this node -- defaults to [0, 0, 0]
// scale: the scale of this node -- defaults to [1, 1, 1]
// rotation: the rotation of this node -- defaults to identity quaternion
function createObject(meshName = "", materialName = "", position = null, rotation = null, scale = null) {
    let renderInfo = new RenderInfo(materialName, meshName);
    let transform = new Transform(position, rotation, scale);
    return new SceneNode(renderInfo, transform);
}     