// ecs.js
// The entity component system
// Built half-hazardly ontop of the scene graph
// Each entity is a node in the scene graph, and each component is able to access the node's transform

// Component
// Defines an interface for a component
// Each component has access to the node's transform
class Component {
    // Attaches a node to a component
    attachNode(node) {
        if (this.node != undefined) {
            console.log("Warning: Attaching a node to a component that already has a node attached");
        }

        this.node = node;
        this.transform = node.transform;
        this.disabled = false;
    }

    // Start is called before the first frame update
    start() {
        // do nothing
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        // do nothing
    }
}

// Entity
// Ties a list of components to a node in the scene graph
class Entity {
    constructor(name, node) {
        this.name = name;
        this.node = node;
        this.components = [];
    }

    // Gets the transform of the entity
    getTransform() {
        return this.node.transform;
    }

    // Attaches a component to this entity
    // component : the component to attach
    attachComponent(component) {
        component.attachNode(this.node);
        this.components.push(component);
    }

    // Gets the component of the given type
    // type : the type of the component
    getComponent(type) {
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i] instanceof type) {
                return this.components[i];
            }
        }

        return null;
    }

    // Adds a child to the entity
    // child : the child to add
    addChild(child) {
        // check if the child is an entity
        if (!(child instanceof Entity)) {
            console.log("Warning: child is not an entity");
            return;
        }
        this.node.addChild(child);
    }

    // Start is called before the first frame update
    start() {
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].start();
        }
    }

    // Updates the entity
    // deltaTime : the time since the last frame
    update(deltaTime) {
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i].disabled == true)
                continue;

            this.components[i].update(deltaTime);
        }
    }
}

// ECS is the entity component system
// It is tied to the scene graph
class ECS {
    constructor(sceneGraph) {
        this.sceneGraph = sceneGraph;
        this.entities = {};
        this.entityToNode = {}; // maps an entity to a node
        this.nodeToEntity = {}; // maps a node to an entity

        // add the camera to the entity list
        this.addEntity("camera", new Entity("camera", this.sceneGraph.camera));
    }

    // Creates a new entity
    // name : the name of the entity
    // parent : the parent of the entity
    // position : the position of the entity
    // rotation : the rotation of the entity
    // scale : the scale of the entity
    // meshName : the mesh to attach to the entity
    // materialName : the material to attach to the entity
    // components : the components to attach to the entity
    createEntity(entityName = "", parent = null, position = null, rotation = null, scale = null, meshName = "", materialName = "", components = new Array()) {
        if (entityName == "") {
            // create a new name from a GUID
            entityName = generateUUID();
        }
        // create the node
        let node = createObject(meshName, materialName, position, rotation, scale);
        // now create the entity
        let entity = new Entity(entityName, node);
        this.entityToNode[entityName] = node;
        this.nodeToEntity[node] = entity;
        // attach the components
        for (let i = 0; i < components.length; i++) {
            // assert that the component is a component
            if (!(components[i] instanceof Component)) {
                console.log("Warning: component is not a component");
                continue;
            }
            entity.attachComponent(components[i]);
        }
        // add the entity to the ECS
        this.addEntity(entityName, entity);

        // add the entity to the scene graph
        if (parent != null) {
            // check if the parent is an entity
            if (!(parent instanceof Entity)) {
                console.log("Warning: parent is not an entity");
                return;
            }

            let parentNode = parent.node;
            parentNode.addChild(node);
        }
        else {
            this.sceneGraph.addObject(node);
        }
        return entity;
    }

    // Adds an entity to the ECS
    // name : the name of the entity
    // entity : the entity to add
    addEntity(name, entity) {
        this.entities[name] = entity;
    }

    // Gets an entity from the ECS
    // name : the name of the entity
    getEntity(name) {
        return this.entities[name];
    }

    // Starts the ECS
    start() {
        for (let key in this.entities) {
            this.entities[key].start();
        }
    }

    // Updates the ECS
    // deltaTime : the time since the last frame
    update(deltaTime) {
        for (let key in this.entities) {
            this.entities[key].update(deltaTime);
        }
    }

    // prints the ECS
    print() {
        // for each entity, print out it's name, and information about it's transform, and render info
        this.sceneGraph.traverse(this.printHelper.bind(this));
    }

    printHelper(node, modelMatrix, depth) {
        let tab = "";
        for (let i = 0; i < depth; i++) {
            tab += "  ";
        }
        let entity = this.nodeToEntity[node]
        if (entity == undefined) {
            entity = "null";
        }

        console.log(tab + "Name: " + entity.name);
        console.log(tab + "Model matrix: " + modelMatrix);
        console.log(tab + "Render info: " + node.renderInfo);
    }
}

// COMPONENTS

// bobbing component
// makes an object bob up and down
class BobComponent extends Component {
    constructor(amplitude = 1, frequency = 1, randomOffset = false) {
        super();
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.time = 0;
        if (randomOffset == true) {
            this.time = (Math.random() * 2 - 1) * Math.PI;
        }
    }

    start() {
        this.startY = this.transform.position.elements[1];
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        this.time += deltaTime;
        let offset = Math.sin(this.time * this.frequency) * this.amplitude;
        this.transform.position.elements[1] = this.startY + offset;
    }
}

// rotate component
// makes an object rotate about an axis
class RotateComponent extends Component {
    constructor(axis = new Vector3([0, 1, 0]), speed = 1) {
        super();
        this.axis = axis;
        this.speed = speed;
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        let rotation = new Quaternion().setFromAxisAngle(this.axis.elements[0], this.axis.elements[1], this.axis.elements[2], this.speed * deltaTime);
        this.transform.rotation = rotation.multiplySelf(this.transform.rotation);
    }
}


// PlayerController
// Responsible for making the player move around
class PlayerController extends Component {
    constructor(movementAxisSet = AxisSets.WASD_KEYS_KEYS, movementSpeed = 1, rotationSpeed = 1, leanAmount = 10, originalRotation = new Quaternion(), walkableRadius) {
        super();
        this.movementAxisSet = movementAxisSet;
        this.movementSpeed = movementSpeed;
        this.rotationSpeed = rotationSpeed;
        this.originalRotation = originalRotation;
        this.previousTheta = 0;
        this.leanAmount = leanAmount;
        this.walkableRadius = walkableRadius;
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        let axis = g_inputManager.getAxis(this.movementAxisSet);

        // the axis is a vector3 with the direction of movement at x,y
        // we want to make it a vector3 with the direction of movement at x,z
        axis.elements[2] = axis.elements[1];
        axis.elements[1] = 0;

        let moveAmount = deltaTime * this.movementSpeed;
        let oldPosition = this.transform.position;
        let newPosition = new Vector3(
            [
                // must negate the movement because the camera is the parent of the scene graph
                // so moving the camera forward is actually moving the scene graph backwards
                oldPosition.elements[0] + axis.elements[0] * moveAmount,
                oldPosition.elements[1] + axis.elements[1] * moveAmount,
                oldPosition.elements[2] - axis.elements[2] * moveAmount,
            ]
        )


        // clamp the new position to be within the bounds of the walkable area
        if (newPosition.length() > this.walkableRadius) {
            newPosition = newPosition.normalize().mul(this.walkableRadius);
        }

        this.transform.position = newPosition;

        // rotates towards the movement direction on the y axis
        let theta = Math.atan2(axis.elements[0], -axis.elements[2]);
        theta = theta * 180 / Math.PI;

        if (axis.elements[0] == 0 && axis.elements[2] == 0) {
            theta = this.previousTheta;
        }
        this.previousTheta = theta;

        let leanAmount = this.leanAmount;
        if (axis.elements[0] == 0 && axis.elements[2] == 0) {
            leanAmount = 0;
        }

        // first, get the rotation that would make the robot face the direction of movement
        let yRotation = new Quaternion().setFromAxisAngle(0, 1, 0, theta);
        yRotation = yRotation.multiplySelf(this.originalRotation);
        // create a rotation that leans towards the new rotation
        // meaning that the back of the robot is higher than the front
        // this is done by lerping between the current rotation and the new rotation
        let iKLean = new Quaternion().setFromAxisAngle(0, 0, 1, leanAmount).multiplySelf(this.originalRotation);
        iKLean = new Quaternion().multiply(this.originalRotation, iKLean);
        yRotation = new Quaternion().multiply(yRotation, iKLean);
        let output = new Quaternion();
        Quaternion.slerp(this.transform.rotation, yRotation, output, this.rotationSpeed * deltaTime);
        this.transform.rotation = output;
    }
}

const ACTIVE_LEG_SET = {
    EVEN: 0,
    ODD: 1,
    ALL: 2,
    NONE: 3,
}

// RobotLegOrchestratorComponent
// Responsible for controlling the gait for a set of robot legs
class RobotLegOrchestratorComponent extends Component {
    // Constructor
    constructor(legIDs) {
        super();
        this.legIDs = legIDs;
        this.legs = new Array();
        this.legComponents = new Array();
        this.activeLegSet = ACTIVE_LEG_SET.EVEN;
        this.timeSinceLastSwitch = 0;
        this.minSwitchTime = 2;
    }

    // Start is called before the first frame update
    start() {
        // return;
        for (let i = 0; i < this.legIDs.length; i++) {
            let leg = g_ecs.getEntity(this.legIDs[i]);
            if (leg == null) {
                console.log("Warning: leg is null");
                continue;
            }
            this.legs.push(leg);
            let legComponent = leg.getComponent(RobotLegCompoent);
            if (legComponent == null) {
                console.log("Warning: leg component is null");
                continue;
            }
            this.legComponents.push(legComponent);
        }

        this.activeLegSet = ACTIVE_LEG_SET.EVEN;
    this.setLegStates(this.activeLegSet);
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        // return;
        // console.log("Active leg set: " + this.activeLegSet);
        // console.log("Time since last switch: " + this.timeSinceLastSwitch)
        let checkIndex = 0;
        if (this.activeLegSet == ACTIVE_LEG_SET.EVEN || this.activeLegSet == ACTIVE_LEG_SET.ALL) {
            checkIndex = 0;
        }
        else if (this.activeLegSet == ACTIVE_LEG_SET.ODD || this.activeLegSet == ACTIVE_LEG_SET.NONE) {
            checkIndex = 1;
        }

        // check if the legs in the active set is moving
        let isMoving = false;
        for (let i = 0; i < this.legComponents.length; i++) {
            if (i % 2 != checkIndex) {
                continue;
            }

            if (this.legComponents[i].moving == true) {
                isMoving = true;
                break;
            }
        }

        if (this.timeSinceLastSwitch > this.minSwitchTime) {
            this.setLegStates(ACTIVE_LEG_SET.ALL);
            this.timeSinceLastSwitch = 0;
            return;
        }

        // now if all the legs are done moving, switch the active leg set
        if (isMoving == false) {
            if (this.activeLegSet == ACTIVE_LEG_SET.EVEN) {
                this.activeLegSet = ACTIVE_LEG_SET.ODD;
            }
            else if (this.activeLegSet == ACTIVE_LEG_SET.ODD) {
                this.activeLegSet = ACTIVE_LEG_SET.EVEN;
            }
            else if (this.activeLegSet == ACTIVE_LEG_SET.ALL) {
                this.activeLegSet = ACTIVE_LEG_SET.EVEN;
            }
            else if (this.activeLegSet == ACTIVE_LEG_SET.NONE) {
                this.activeLegSet = ACTIVE_LEG_SET.ODD;
            }
            this.setLegStates(this.activeLegSet);
            this.timeSinceLastSwitch = 0;
        }
        else {
            this.timeSinceLastSwitch += deltaTime;
        }
    }

    setLegStates(state) {
        const isValidState = (index) => {
            if (state == ACTIVE_LEG_SET.EVEN) {
                return index % 2 == 0;
            }
            else if (state == ACTIVE_LEG_SET.ODD) {
                return index % 2 == 1;
            }
            else if (state == ACTIVE_LEG_SET.ALL) {
                return true;
            }
            else if (state == ACTIVE_LEG_SET.NONE) {
                return false;
            }
        }

        for (let i = 0; i < this.legComponents.length; i++) {
            // console.log("Setting leg " + i + " to " + isValidState(i));
            this.legComponents[i].allowStep = isValidState(i);
        }
    }
}

// RobotLegCompoent
// Responsible for controlling a robot leg
// Uses inverse kinematics to move the leg, and debug markers to show the leg's position
class RobotLegCompoent extends Component {
    // Constructor
    constructor(upperLegEntityID, lowerLegEntityID, pelvisID, kneeEntityID, // actual entities
        footPosOffset, groundY, speed, upperLegLength, lowerLegLength, // settings
        idealMarkerEntityID = null, actualMarkerEntityID = null, kneeMarkerID = null // used for debugging
    ) {
        super();
        // Entity legIDs
        this.upperLegEntityID = upperLegEntityID;
        this.lowerLegEntityID = lowerLegEntityID;
        this.idealMarkerEntityID = idealMarkerEntityID;
        this.actualMarkerEntityID = actualMarkerEntityID;
        this.kneeTargetEntityID = kneeEntityID; // the target for the knee
        this.kneeEntityID = kneeMarkerID; // the 
        this.pelvisID = pelvisID;

        // Needed for the IK
        this.upperLegEntity = null;
        this.lowerLegEntity = null;
        this.pelvisEntity = null;

        // Settings
        this.groundY = groundY;
        this.speed = speed;
        this.footPosOffset = footPosOffset;
        this.stepDistance = (lowerLegLength + upperLegLength);
        this.stepSpeed = c_PLAYER_MOVE_SPEED;
        this.stepHeight = 2;
        this.upperLegLength = upperLegLength;
        this.lowerLegLength = lowerLegLength;

        // Used for debugging
        this.time = 0;
        this.allowStep = true;
    }

    // Start is called before the first frame update
    start() {
        this.upperLegEntity = g_ecs.getEntity(this.upperLegEntityID);
        this.lowerLegEntity = g_ecs.getEntity(this.lowerLegEntityID);
        this.pelvisEntity = g_ecs.getEntity(this.pelvisID);
        this.kneeEntity = g_ecs.getEntity(this.kneeTargetEntityID);

        // get the marker entities -- used for debugging
        this.footIdealMarkerEntity = g_ecs.getEntity(this.idealMarkerEntityID);
        this.footActualMarkerEntity = g_ecs.getEntity(this.actualMarkerEntityID);
        this.kneeMarkerEntity = g_ecs.getEntity(this.kneeEntityID);

        this.footIdealPosition = this.calculateIdealFootPlacementPosition();
        this.footActualPosition = this.footIdealPosition;
        this.kneePosition = this.calculateKneePosition();
        this.pelvisPosition = this.pelvisEntity.node.transform.getWorldPosition();

        this.moving = false;
        this.movementProgress = 0;
        this.startingFootRaisePosition = this.footActualPosition;
        this.endingFootRaisePosition = this.footActualPosition;
        this.previousKneePosition = this.kneePosition;
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        // update the foot placement position
        let idealFootPosition = this.calculateIdealFootPlacementPosition();
        this.footIdealPosition = idealFootPosition;
        let idealKneePosition = this.calculateKneePosition();
        this.kneePosition = this.kneePosition.lerp(idealKneePosition, 0.5);
        this.pelvisPosition = this.pelvisEntity.node.transform.getWorldPosition();

        let idealDistance = idealFootPosition.distanceTo(this.footActualPosition);
        let footToPelvis = this.pelvisPosition.sub(this.footActualPosition);
        let footToPelvisLength = footToPelvis.length();
        let legLength = this.upperLegLength + this.lowerLegLength;

        if (this.allowStep == false && this.moving == false && footToPelvisLength < legLength) {
            this.updateGizmos();
            return;
        }

        let nextStepDistance = this.endingFootRaisePosition.distanceTo(this.footActualPosition);
        // console.log("Distance: " + idealDistance);
        // console.log("Next step distance: " + nextStepDistance);

        // start a step if we are far enough away
        if (idealDistance > this.stepDistance && this.moving == false) {
            // snap to the ideal position
            this.moving = true;
            this.movementProgress = 0;
            let stepDirection = idealFootPosition.sub(this.footActualPosition).normalize();
            this.startingFootRaisePosition = this.footActualPosition;
            this.endingFootRaisePosition = idealFootPosition;
            return;
        }

        // stop moving if we are close enough
        if (nextStepDistance < 0.01 && this.moving == true) {
            // snap to the step position
            // this.actualPosition = this.endingFootRaisePosition;
            this.moving = false;
            this.movementProgress = 0;
            this.startingFootRaisePosition = this.footActualPosition;
            this.endingFootRaisePosition = this.footActualPosition;
        }

        // move the foot
        if (this.moving == true) {
            this.movementProgress += deltaTime * this.stepSpeed;
            // slowly move the end position to the ideal position
            // slowly lerp the steps to the ideal position
            this.startingFootRaisePosition = this.startingFootRaisePosition.lerp(idealFootPosition, deltaTime * this.stepSpeed * 2);
            this.endingFootRaisePosition = this.endingFootRaisePosition.lerp(idealFootPosition, deltaTime * this.stepSpeed * 2);

            // clamp the movement progress
            if (this.movementProgress > 1) {
                this.movementProgress = 1;
            }
            if (this.movementProgress < 0) {
                this.movementProgress = 0;
            }
            // console.log("Movement progress: " + this.movementProgress);
            this.footActualPosition = this.parabolicLerp(this.startingFootRaisePosition, this.endingFootRaisePosition, this.stepHeight, this.movementProgress);
        }


        this.updateGizmos();
    }

    // Lerps between two points using a parabolic curve
    // this parabolic curve moves the y value up, then down
    // a : the first point
    // b : the second point
    // h : the arch height of the parabola
    // t : the time
    parabolicLerp(a, b, h, t) {
        let linear = a.lerp(b, t);
        // add the height of the parabola
        linear.elements[1] += h * Math.sin(t * Math.PI);
        return linear;
    }

    updateGizmos() {
        if (this.footIdealMarkerEntity != null) {
            this.footIdealMarkerEntity.getTransform().position = this.footIdealPosition;
        }
        if (this.footActualMarkerEntity != null) {
            this.footActualMarkerEntity.getTransform().position = this.footActualPosition;
        }
        if (this.kneeMarkerEntity != null) {
            this.kneeMarkerEntity.getTransform().position = this.kneePosition;
        }
    }

    calculateIdealFootPlacementPosition() {
        // return new Vector3();
        // representation of the foot placement position
        let pelvisWorldPosition = this.pelvisEntity.node.transform.getWorldPosition();
        let pelvisModelMatrix = this.pelvisEntity.node.transform.getWorldModelMatrix();

        let offsetVector = new Vector4([this.footPosOffset.elements[0], this.footPosOffset.elements[1], this.footPosOffset.elements[2], 0]);
        let rotatedOffset = pelvisModelMatrix.multiplyVector4(offsetVector);

        let idealPosition = new Vector3(
            [
                pelvisWorldPosition.elements[0] + rotatedOffset.elements[0],
                this.groundY,
                pelvisWorldPosition.elements[2] + rotatedOffset.elements[2],
            ]
        );

        return idealPosition;
    }

    calculateKneePosition() {
        // return new Vector3();
        // representation of the foot placement position
        let pelvisWorldPosition = this.pelvisEntity.node.transform.getWorldPosition();
        let footWorldPosition = this.footActualPosition;
        let kneeTargetWorldPosition = this.kneeEntity.node.transform.getWorldPosition();

        // now find a position to place the knee such that the constraints are met
        // these constraints are:
        // 1. the knee exists on the same plane as the foot, pelvis, and kneeTarget
        // 2. the knee is an upperLegLength away from the pelvis
        // 3. the knee is a lowerLegLength away from the foot
        // 4. the knee should be as close to the kneeTargetWorldPosition as possible

        // if these aren't met, the knee is placed at the halfway point between the pelvis and the foot
        // this is the default position

        return this.ikSolveNew(pelvisWorldPosition, footWorldPosition, kneeTargetWorldPosition, this.upperLegLength, this.lowerLegLength);
    }

    ikSolveNew(pelvisPosition, footPosition, kneeTargetPosition, upperLegLength, lowerLegLength,) {
        // find the position of the knee
        // the knee is the point where the two circles intersect
        // the knee position should be on the same plane as the pelvis, foot, and knee target

        // using the pelvis, foot, and knee target, we need to define a plane
        // this plane will allow us to simplify the problem into 2D

        // implement fabrik with the knee target as an anchor target/pole target
        // the knee target will be the pole target

        let pelvis = new Vector3(pelvisPosition.elements);
        let foot = new Vector3(footPosition.elements);
        let kneeTarget = new Vector3(kneeTargetPosition.elements);

        // Calculate the plane normal
        let pelvisToFoot = foot.sub(pelvis);

        if (pelvisToFoot.length() > upperLegLength + lowerLegLength) {
            // just return the midpoint between the pelvis and the foot
            let midpoint = pelvis.add(pelvisToFoot.mul(0.5));
            return midpoint;
        }

        let pelvisToKneeTarget = kneeTarget.sub(pelvis);
        let planeNormal = pelvisToFoot.cross(pelvisToKneeTarget).normalize();

        // Project all points onto the plane
        let projectOntoPlane = function (point, planePoint, normal) {
            let pointToPlanePoint = point.sub(planePoint);
            let distance = pointToPlanePoint.dot(normal);
            return point.sub(normal.mul(distance));
        };

        pelvis = projectOntoPlane(pelvis, pelvis, planeNormal);
        foot = projectOntoPlane(foot, pelvis, planeNormal);
        kneeTarget = projectOntoPlane(kneeTarget, pelvis, planeNormal);

        // pelvis.printMe();
        // foot.printMe();
        // kneeTarget.printMe();

        // FABRIK algorithm
        let tolerance = 0.01;
        let maxIterations = 10;
        let iteration = 0;
        let currentFootPosition = new Vector3();
        let kneePosition = new Vector3();

        while (currentFootPosition.distanceTo(foot) > tolerance && iteration < maxIterations) {
            // Backward
            kneePosition = foot.sub(pelvis).normalize().mul(upperLegLength).add(pelvis);
            pelvis = foot.sub(kneePosition).normalize().mul(lowerLegLength).add(kneePosition);

            let footToKnee = kneePosition.sub(foot);
            let pelvisToKnee = kneePosition.sub(pelvis);

            // footToKnee.printMe();
            // pelvisToKnee.printMe();

            // Forward
            kneePosition = pelvis.add(kneePosition.sub(pelvis).normalize().mul(upperLegLength));
            currentFootPosition = kneePosition.add(foot.sub(kneePosition).normalize().mul(lowerLegLength));

            // Adjust knee using pole target
            let kneeToKneeTarget = kneeTarget.sub(kneePosition);
            // kneeToKneeTarget.printMe();
            let kneeToPelvis = pelvis.sub(kneePosition);
            let correction = kneeToKneeTarget.normalize().mul(kneeToPelvis.length());
            kneePosition = kneePosition.addSelf(correction);
            iteration++;
        }

        return kneePosition;
    }
}

const SEGMENT_TYPE = {
    UPPER_LEG: 0,
    LOWER_LEG: 1,
}

// RobotLegSegmentComponent
// Responsible for controlling a segment of a robot leg
// Used in conjunction with the RobotLegCompoent to create a full leg
// These control the position and rotation of the leg segments, not the IK
class RobotLegSegmentComponent extends Component {
    constructor(legControllerEntityID, segmentType) {
        super();
        this.legControllerEntityID = legControllerEntityID;
        this.legControllerEntity = null;
        this.legControllerComponent = null;
        this.segmentType = segmentType;
    }

    start() {
        this.legControllerEntity = g_ecs.getEntity(this.legControllerEntityID);
        if (this.legControllerEntity == null) {
            console.log("Unable to get leg controller entity");
            return;
        }

        this.legControllerComponent = this.legControllerEntity.getComponent(RobotLegCompoent);
        if (this.legControllerComponent == null) {
            console.log("Unable to get leg controller component");
            return;
        }
    }

    update(deltaTime) {
        if (this.legControllerComponent == null) {
            return;
        }

        // get the position of the origin of the segment
        // if the segment is the upper leg, the origin is the pelvis
        // and the knee is the target
        // if the segment is the lower leg, the origin is the knee
        // and the foot is the target
        let originPosition = new Vector3();
        let targetPosition = new Vector3();
        if (this.segmentType == SEGMENT_TYPE.UPPER_LEG) {
            originPosition = this.legControllerComponent.pelvisPosition;
            targetPosition = this.legControllerComponent.kneePosition;
        }
        else if (this.segmentType == SEGMENT_TYPE.LOWER_LEG) {
            originPosition = this.legControllerComponent.kneePosition;
            targetPosition = this.legControllerComponent.footActualPosition;
        }

        // rotate the segment to point towards the target from the origin
        let direction = targetPosition.sub(originPosition);
        // adjust the y scale to match the length of the segment
        let requiredLength = direction.length();
        this.transform.scale.elements[1] = requiredLength / 2;
        let rotation = new Quaternion().setFromUnitVectors(new Vector3([0, 1, 0]), direction.normalize());
        // slerp between the current rotation and the new rotation
        this.transform.rotation = rotation;
        this.transform.position = originPosition.add(direction.mul(requiredLength / 2));
    }
}


// ShakerComponent
// Makes an object shake
class ShakerComponent extends Component {
    constructor(amplitude = 1) {
        super();
        this.amplitude = amplitude;
        this.time = 0;
    }

    start() {
        this.startPosition = this.transform.position;
    }

    // Updates the component
    // deltaTime : the time since the last frame
    update(deltaTime) {
        // generate a random point within the unit sphere, then scale it by the amplitude
        let randomPoint = new Vector3([Math.random(), Math.random(), Math.random()]);
        randomPoint = randomPoint.sub(new Vector3([0.5, 0.5, 0.5]));
        randomPoint = randomPoint.normalize();
        randomPoint = randomPoint.mul(this.amplitude);

        // lerp between the current position and the new position
        let output = new Vector3();
        let newPoint = this.startPosition.add(randomPoint);
        output = this.transform.position.lerp(newPoint, 0.1);
        this.transform.position = output;
    }
}

const CAMERA_MODE = {
    FOLLOW: 0,
    AIRPLANE: 1,
}

class CameraControllerComponent extends Component {
    constructor(cameraEntityID, entityFollowID, { movementSpeed = 1, rotationSpeed = 1, leanAmount = 10, offset = new Vector3([0, 0, 0]), cameraHTMLID = "camera"}) {
        super();
        this.cameraEntityID = cameraEntityID;
        this.movementSpeed = movementSpeed;
        this.rotationSpeed = rotationSpeed;
        this.leanAmount = leanAmount;
        this.previousTheta = 0;
        this.offset = offset;
        this.entityFollowID = entityFollowID;

        this.camera = g_sceneGraph.getCamera(this.cameraEntityID);

        this.originalRotation = this.camera.getRotation();
        this.mode = CAMERA_MODE.FOLLOW;

        this.playerController = g_ecs.getEntity(this.entityFollowID).getComponent(PlayerController);

        this.lookAtRadius = 10;
        this.phi = 0;
        this.theta = 0;
        this.cameraHTMLID = cameraHTMLID;
    }

    start() {
    }

    update(deltaTime) {
        if (g_inputManager.getKeyState(" ") == ButtonState.DOWN_THIS_FRAME) {
            console.log("Switching camera mode");
            this.mode = (this.mode + 1) % 2;

            // now update the camera mode being displayed
            let cameraModeText = (this.mode == CAMERA_MODE.FOLLOW) ? "Follow" : "Free";
            document.getElementById(this.cameraHTMLID).innerText = "Camera Mode: " + cameraModeText;
        }

        switch (this.mode) {
            case CAMERA_MODE.FOLLOW:
                this.handleFollowMode(deltaTime);
                break;
            case CAMERA_MODE.AIRPLANE:
                this.handleAirplaneMode(deltaTime);
                break;
        }

        // set the posiition of this object to the camera
        this.transform.position = this.camera.getPosition();
        this.transform.rotation = this.camera.getRotation();
    }

    handleFollowMode(deltaTime) {
        // follow the entity
        let entity = g_ecs.getEntity(this.entityFollowID);
        if (entity == null) {
            return;
        }


        if (this.playerController != null)
            this.playerController.disabled = false;

        let entityTransform = entity.getTransform();
        let targetPosition = entityTransform.position.add(this.offset);

        // remove the bobbing effect
        targetPosition.elements[1] = this.offset.elements[1];

        // calculate phi and theta, based upon the target position
        // such that when the camera is in airplane mode, it will look at the target
        let lookAtDirection = entityTransform.position.sub(this.camera.getPosition()).normalize();
        // now calculate the theta and phi
        this.theta = Math.atan2(lookAtDirection.elements[2], lookAtDirection.elements[0]);
        this.phi = Math.acos(lookAtDirection.elements[1]);

        // lerp between the current position and the target position
        let output = new Vector3();
        output = this.camera.getPosition().lerp(targetPosition, 0.1);

        // now set the camera position to the target position
        this.camera.setPosition(output);

        // lerp to the original rotation
        let rotation = this.camera.getRotation();
        let targetRotation = this.originalRotation;

        let outputRotation = new Quaternion();
        Quaternion.slerp(rotation, targetRotation, outputRotation, 3.0 * deltaTime);

        this.camera.setRotation(outputRotation);

    }

    handleAirplaneMode(deltaTime) {

        if (this.playerController != null)
            this.playerController.disabled = true;

        // allow the user to move the camera around with WASD, and rotate with the mouse
        let xzAxis = g_inputManager.getAxis(AxisSets.WASD_KEYS);
        let delta = g_inputManager.getMouseChange();

        // determine if we should move up or down
        let up = (g_inputManager.getKeyState("q") <= ButtonState.DOWN) ? 1 : 0;
        let down = (g_inputManager.getKeyState("e") <= ButtonState.DOWN) ? 1 : 0;

        let yMovement = up - down;

        let moveAmount = deltaTime * this.movementSpeed;

        let moveDirection = new Vector3([xzAxis.elements[0], yMovement, xzAxis.elements[1]]).normalize();
        // rotate the move direction based upon the camera's rotation
        moveDirection = this.camera.getRotation().multiplyVector3(moveDirection, moveDirection)
        // moveDirection.printMe();
        let oldPosition = this.camera.getPosition();

        let newPosition = new Vector3(
            [
                oldPosition.elements[0] + moveDirection.elements[0] * moveAmount,
                oldPosition.elements[1] + moveDirection.elements[1] * moveAmount,
                oldPosition.elements[2] - moveDirection.elements[2] * moveAmount,
            ]
        )

        this.camera.setPosition(newPosition);

        // rotate the camera based on the input of the mouse
        if (g_inputManager.getKeyState("mouse0") == ButtonState.DOWN) {
            if (g_inputManager.clickedCanvas != this.cameraEntityID) {
                return;
            }

            let delta = g_inputManager.getMouseChange();

            // calculate the new theta and phi
            this.theta += delta.elements[0] * -this.rotationSpeed * deltaTime;
            this.phi += delta.elements[1] * -this.rotationSpeed * deltaTime;
        }

        // clamp the phi
        if (this.phi < 0.1) {
            this.phi = 0.1;
        }

        if (this.phi > Math.PI - 0.1) {
            this.phi = Math.PI - 0.1;
        }

        // now calculate the look at position, based upon the theta and phi
        let x = this.lookAtRadius * Math.sin(this.phi) * Math.cos(this.theta);
        let y = this.lookAtRadius * Math.cos(this.phi);
        let z = this.lookAtRadius * Math.sin(this.phi) * Math.sin(this.theta);

        let lookAtPosition = new Vector3([x, y, z]).add(newPosition);
        // now look at the target
        let lookAtMatrix = new Matrix4().setLookAt(newPosition.elements[0], newPosition.elements[1], newPosition.elements[2], lookAtPosition.elements[0], lookAtPosition.elements[1], lookAtPosition.elements[2], 0, 1, 0);
        let rotation = new Quaternion().setFromRotationMatrix(lookAtMatrix);

        this.camera.setRotation(rotation);
    }
}

class FollowLookAtComponent extends Component {
    constructor(cameraEntityID, lookAtDisance)
    {
        super();
        this.cameraEntity = g_sceneGraph.getCamera(cameraEntityID);
        this.lookAtDisance = lookAtDisance;
    }

    update(deltaTime)
    {
        // set the position to the look at
        this.transform.position = this.cameraEntity.getLookAtPosition(this.lookAtDisance);
    }
}

class OrthographicCameraControllerComponent extends Component {
    constructor(cameraEntityID, { rotationSpeed = 1, lookAtPosition = new Vector3([0, 0, 0]) }) {
        super();
        this.cameraEntityID = cameraEntityID;
        this.rotationSpeed = rotationSpeed;
        this.lookAtPosition = lookAtPosition;
        this.previousMousePosition = new Vector3([0, 0, 0]);
        this.camera = g_sceneGraph.getCamera(this.cameraEntityID);
        this.initalPosition = this.camera.getPosition();
        this.radius = this.initalPosition.distanceTo(this.lookAtPosition);
        console.log("Radius: " + this.radius);

        // calculate the inital theta
        this.theta = Math.atan2(this.initalPosition.elements[0], this.initalPosition.elements[2]);

        this.setPositionAndRotation();
    }

    start() {
    }

    update(deltaTime) {
        if (g_inputManager.getKeyState("mouse0") == ButtonState.DOWN) {
            // check that this is the correct canvas
            if (g_inputManager.clickedCanvas != this.cameraEntityID) {
                return;
            }

            console.log("Mouse down");
            let delta = g_inputManager.getMouseChange();

            // calculate the new theta
            this.theta += delta.elements[0] * -this.rotationSpeed * deltaTime;

            this.setPositionAndRotation();

            // // now look at the target
            // let lookAtRotation = new Quaternion().setFromUnitVectors(new Vector3([0, 1, 0]), this.lookAtPosition.sub(newPosition).normalize());
            // this.camera.setRotation(lookAtRotation);
        }
    }

    setPositionAndRotation() {
        // calculate the new position
        let x = this.radius * Math.sin(this.theta);
        let z = this.radius * Math.cos(this.theta);

        let newPosition = new Vector3([x, this.initalPosition.elements[1], z]);

        // add the look at position
        newPosition = newPosition.add(this.lookAtPosition);
        // set the new position
        this.camera.setPosition(newPosition)

        // now calculate the rotation
        let lookAtMatrix = new Matrix4().setLookAt(newPosition.elements[0], newPosition.elements[1], newPosition.elements[2], this.lookAtPosition.elements[0], this.lookAtPosition.elements[1], this.lookAtPosition.elements[2], 0, 1, 0);
        let rotation = new Quaternion().setFromRotationMatrix(lookAtMatrix);

        this.camera.setRotation(rotation);
    }

}

class RotateOnMouseDragComponent extends Component {
    constructor(canvasID = "webgl", camerControllerEntity = "camera controller", rotationSpeed = 10) {
        super();
        this.rotationSpeed = rotationSpeed;
        this.previousMousePosition = new Vector3([0, 0, 0]);

        this.camerControllerEntity = camerControllerEntity;
        this.canvasID = canvasID;
    }

    start() {
    }

    update(deltaTime) {
        if (this.cameraController == null) {
            this.cameraController = g_ecs.getEntity(this.camerControllerEntity).getComponent(CameraControllerComponent);
        }
        if (this.cameraController != null) {
            if (this.cameraController.mode == CAMERA_MODE.AIRPLANE) {
                return;
            }
        }

        if (g_inputManager.getKeyState("mouse0") == ButtonState.DOWN) {

            // check that this is the correct canvas
            if (g_inputManager.clickedCanvas != this.canvasID) {
                return;
            }

            let delta = g_inputManager.getMouseChange();

            let rotation = new Quaternion().setFromAxisAngle(0, 1, 0, delta.elements[0] * -this.rotationSpeed * deltaTime);
            this.transform.rotation = rotation.multiplySelf(this.transform.rotation);
        }
    }
}

class LightComponent extends Component
{
    constructor(type, diffuseColor, specularColor, intensity, flickerSpeed = 5, flickerAmount = 0.05)
    {
        super()
        this.type = type
        this.diffuseColor = diffuseColor
        this.specularColor = specularColor;
        this.intensity = intensity
        this.flickerSpeed = flickerSpeed + Math.random() * 0.5
        this.flickerAmount = flickerAmount + Math.random() * 0.05
        this.offset = Math.random() * flickerSpeed
    }

    start()
    {
        // add a point light, and bind it to the transform
        let light = g_lightRegistry.addLight(this.diffuseColor, this.specularColor, this.intensity, this.transform.position, this.type)

        if (light != null)
        {
            this.light = light
            this.light.bindTransform(this.transform)
            this.time = 0
        }
    }

    update(deltaTime)
    {
        if (this.light != null)
        {
            // flicker the light based on the time
            this.time += deltaTime;
            this.light.intensity = Math.sin(this.time * this.flickerSpeed + this.offset) * this.flickerAmount + this.intensity;
        }
    }
}