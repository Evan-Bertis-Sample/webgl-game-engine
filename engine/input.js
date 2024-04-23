// input.js
// Handles input for the application

// Enum for button states
const ButtonState = {
    DOWN_THIS_FRAME: 0,
    DOWN: 1,
    UP_THIS_FRAME: 2,
    UP: 3,
};

const AxisSets = {
    ARROW_KEYS: 0,
    WASD_KEYS: 1,
    MOUSE_MOVEMENT: 2,
    MOUSE_POSITION: 3,
}

// InputManager
// Handles input for the application
class InputManager {
    constructor() {
        this.keyStates = {};
        this.mousePos = new Vector3([0, 0, 0]);
        this.mouseChange = new Vector3([0, 0, 0]);
        // Callbacks are a function that takes the new state of the button
        this.buttonCallbacks = {};
        this.axisCallbacks = {};

        this.clickedCanvas = ""
    }

    // Ataches the input manager to the document
    attach() {
        document.addEventListener('keydown', this.keyDownHandler.bind(this));
        document.addEventListener('keyup', this.keyUpHandler.bind(this));
        document.addEventListener('mousemove', this.mouseMoveHandler.bind(this));

        // handle the mouse0 button
        document.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        document.addEventListener('mouseup', this.mouseUpHandler.bind(this));
    }

    // Handles key down events
    keyDownHandler(event) {
        this.keyStates[event.key] = ButtonState.DOWN_THIS_FRAME;
        // call the callbacks
        if (this.buttonCallbacks[event.key] != undefined) {
            for (let i = 0; i < this.buttonCallbacks[event.key].length; i++) {
                this.buttonCallbacks[event.key][i](ButtonState.DOWN_THIS_FRAME);
            }
        }
    }

    mouseDownHandler(event) {
        this.keyStates["mouse0"] = ButtonState.DOWN_THIS_FRAME;
        // get the canvas that was clicked
        this.clickedCanvas = event.target.id;
        
        // call the callbacks
        if (this.buttonCallbacks["mouse0"] != undefined) {
            for (let i = 0; i < this.buttonCallbacks["mouse0"].length; i++) {
                this.buttonCallbacks["mouse0"][i](ButtonState.DOWN_THIS_FRAME);
            }
        }
    }

    // Handles key up events
    keyUpHandler(event) {
        this.keyStates[event.key] = ButtonState.UP_THIS_FRAME;
        // call the callbacks
        if (this.buttonCallbacks[event.key] != undefined) {
            for (let i = 0; i < this.buttonCallbacks[event.key].length; i++) {
                this.buttonCallbacks[event.key][i](ButtonState.UP_THIS_FRAME);
            }
        }
    }

    mouseUpHandler(event) {
        this.keyStates["mouse0"] = ButtonState.UP_THIS_FRAME;
        // call the callbacks
        if (this.buttonCallbacks["mouse0"] != undefined) {
            for (let i = 0; i < this.buttonCallbacks["mouse0"].length; i++) {
                this.buttonCallbacks["mouse0"][i](ButtonState.UP_THIS_FRAME);
            }
        }
    }

    // Handles mouse move events
    mouseMoveHandler(event) {
        // update the mouse position and the mouse change
        this.mouseChange.elements[0] = event.movementX;
        this.mouseChange.elements[1] = event.movementY;
        this.mousePos.elements[0] = event.clientX;
        this.mousePos.elements[1] = event.clientY;
    }

    // attach a callback to a key
    // key : the key to attach the callback to
    // callback : the callback function -- takes the new state of the button
    attachButtonCallback(key, callback) {
        if (this.buttonCallbacks[key] == undefined) {
            this.buttonCallbacks[key] = [];
        }

        this.buttonCallbacks[key].push(callback);
    }

    // attach a callback to an axis
    // axis : the axis to attach the callback to
    // callback : the callback function -- takes the new state of the axis
    attachAxisCallback(axis, callback) {
        if (this.axisCallbacks[axis] == undefined) {
            this.axisCallbacks[axis] = [];
        }

        this.axisCallbacks[axis].push(callback);
    }

    // Returns the state of the given key
    // key : the key to check
    getKeyState(key) {
        if (this.keyStates[key] == undefined) {
            return ButtonState.UP;
        }

        return this.keyStates[key];
    }

    // Returns the mouse position
    getMousePos() {
        return this.mousePos;
    }

    // Returns the mouse change
    getMouseChange() {
        return this.mouseChange;
    }

    // Updates the input manager
    update() {
        // update the key states
        for (let key in this.keyStates) {
            if (this.keyStates[key] == ButtonState.DOWN_THIS_FRAME) {
                this.keyStates[key] = ButtonState.DOWN;
            }
            else if (this.keyStates[key] == ButtonState.UP_THIS_FRAME) {
                this.keyStates[key] = ButtonState.UP;
            }
        }

        // for each of the states, call the callbacks
        for (let key in this.buttonCallbacks) {
            for (let i = 0; i < this.buttonCallbacks[key].length; i++) {
                this.buttonCallbacks[key][i](this.keyStates[key]);
            }
        }

        // for each of the axes, call the callbacks
        for (let axis in this.axisCallbacks) {
            let axisValue = this.getAxis(axis);
            for (let i = 0; i < this.axisCallbacks[axis].length; i++) {
                this.axisCallbacks[axis][i](axisValue);
            }
        }

        // check for mouse movement
        this.mouseChange.elements[0] *= 0.5;
        this.mouseChange.elements[1] *= 0.5;
    }


    // Returns a vector representing the current state of the movement axes
    // axisSet : the set of axes to use
    getAxis(axisSet) {
        let axis = new Vector3([0, 0, 0]);
        if (axisSet == AxisSets.ARROW_KEYS) {
            if (this.getKeyState("ArrowUp") <= ButtonState.DOWN) {
                axis.elements[1] += 1;
            }
            if (this.getKeyState("ArrowDown") <= ButtonState.DOWN) {
                axis.elements[1] -= 1;
            }
            if (this.getKeyState("ArrowLeft") <= ButtonState.DOWN) {
                axis.elements[0] -= 1;
            }
            if (this.getKeyState("ArrowRight") <= ButtonState.DOWN) {
                axis.elements[0] += 1;
            }
        }
        else if (axisSet == AxisSets.WASD_KEYS) {
            if (this.getKeyState("w") <= ButtonState.DOWN) {
                axis.elements[1] += 1;
            }
            if (this.getKeyState("s") <= ButtonState.DOWN) {
                axis.elements[1] -= 1;
            }
            if (this.getKeyState("a") <= ButtonState.DOWN) {
                axis.elements[0] -= 1;
            }
            if (this.getKeyState("d") <= ButtonState.DOWN) {
                axis.elements[0] += 1;
            }
        }
        else if (axisSet == AxisSets.MOUSE_MOVEMENT) {
            axis = this.getMouseChange();
        }
        else if (axisSet == AxisSets.MOUSE_POSITION) {
            axis = this.getMousePos();
        }

        return axis;
    }
}