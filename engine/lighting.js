// lighting.js

const LIGHT_TYPE = {
    POINT: 0,
    DIRECTIONAL: 1
}

class Light {
    constructor(lightType, diffuseColor, specularColor, intensity, position, attenuationFunction = 2) {
        this.lightType = lightType;
        this.diffuseColor = diffuseColor;
        this.specularColor = specularColor
        this.intensity = intensity;
        this.attenuationFunction = attenuationFunction;

        // make sure that the position is a vec3
        this.position = new Vector3(position.elements)
        this.transformBinding = null

        this.active = true;
    }

    bindTransform(transform) {
        this.transformBinding = transform;
    }
}

class LightingRegistry {
    constructor(lights = new Array()) {
        this.lights = lights;
        this.lightLocations = new Map(); // map from gl to map of string to gl locations for each light attribute
        this.lightNumLocations = new Map(); // map from gl to numLights locations
        this.ambientLightLocations = new Map(); // map from gl to ambient light locations
        this.ambientLightIntensityLocations = new Map(); // map from gl to ambient light intensity locations
        this.ambientLight = new Vector3([0.6, 0.52, 0.85]);
        this.ambientLightIntensity = 0.5;
        this.MAX_LIGHTS = 16;
    }

    updateLights() {
        for (let i = 0; i < this.lights.length; i++) {
            // update the position
            let light = this.lights[i];
            if (light.transformBinding != null) {
                let transform = light.transformBinding;
                if (light.lightType == LIGHT_TYPE.POINT) {
                    // set the position to the transform's position
                    let position = transform.worldPosition;
                    // position.printMe()

                    light.position.elements[0] = position.elements[0];
                    light.position.elements[1] = position.elements[1];
                    light.position.elements[2] = position.elements[2];
                }
                else {
                    // set the position to the direction of the transform
                    let rotationQuat = transform.rotation;
                    let rotationMatrix = new Matrix4();
                    rotationMatrix.setFromQuat(rotationQuat);
                    let direction = new Vector3([0, 0, 1]);
                    direction = rotationMatrix.multiplyVector3(direction);
                    light.position.elements[0] = direction.elements[0];
                    light.position.elements[1] = direction.elements[1];
                    light.position.elements[2] = direction.elements[2];
                }
            }
        }
    }

    // load the lights into the gl buffers
    loadLights(gl) {
        let numLights = this.lights.length;
        if (!this.lightLocations.has(gl.program)) {
            this.findLightLocations(gl)
        }

        let lightLocation = this.lightNumLocations.get(gl.program);
        gl.uniform1i(lightLocation, numLights);

        let ambientLocation = this.ambientLightLocations.get(gl.program);
        gl.uniform3fv(ambientLocation, this.ambientLight.elements);

        let ambientIntensityLocation = this.ambientLightIntensityLocations.get(gl.program);
        gl.uniform1f(ambientIntensityLocation, this.ambientLightIntensity);

        for (let i = 0; i < numLights; i++) {
            this.passLight(gl, this.lights[i], i);
        }
    }

    addLight(diffuseColor, specularColor, intensity, position, lightType) {
        // check if we are at our limit
        if (this.lights.length > this.MAX_LIGHTS) {
            console.log("Max lights reached");
            return null;
        }

        let light = new Light(lightType, diffuseColor, specularColor, intensity, position);
        this.lights.push(light);

        return light;
    }

    getLight(index) {
        if (index < 0 || index >= this.lights.length) {
            return null;
        }

        return this.lights[index];
    }

    passLight(gl, light, index) {
        let lightLocations = this.lightLocations.get(gl.program);
        let positionLocation = lightLocations.get(`position[${index}]`);
        let diffuseLocation = lightLocations.get(`diffuseColor[${index}]`);
        let specularLocation = lightLocations.get(`specularColor[${index}]`)
        let intensityLocation = lightLocations.get(`intensity[${index}]`);
        let lightTypeLocation = lightLocations.get(`lightType[${index}]`);
        let distanceFunctionLocation = lightLocations.get(`attenuationFunction[${index}]`);

        gl.uniform3fv(positionLocation, light.position.elements);
        gl.uniform3fv(diffuseLocation, light.diffuseColor.elements);
        gl.uniform3fv(specularLocation, light.specularColor.elements);

        if (light.active)
            gl.uniform1f(intensityLocation, light.intensity);
        else
            gl.uniform1f(intensityLocation, 0);

        gl.uniform1i(lightTypeLocation, light.lightType);
        gl.uniform1i(distanceFunctionLocation, light.attenuationFunction);
    }


    findLightLocations(gl) {
        console.log("Finding light locations");
        let mapLocation = new Map();
        for (let i = 0; i < this.MAX_LIGHTS; i++) {
            let positionName = "u_lightBuffer.lights[0].position".replace("0", i);
            let diffuseName = "u_lightBuffer.lights[0].diffuseColor".replace("0", i);
            let specularName = "u_lightBuffer.lights[0].specularColor".replace("0", i)
            let intensityName = "u_lightBuffer.lights[0].intensity".replace("0", i);
            let lightTypeName = "u_lightBuffer.lights[0].lightType".replace("0", i);
            let distanceFunctionName = "u_lightBuffer.lights[0].attenuationFunction".replace("0", i);

            let positionLocation = gl.getUniformLocation(gl.program, positionName);
            let diffuseLocation = gl.getUniformLocation(gl.program, diffuseName);
            let specularLocation = gl.getUniformLocation(gl.program, specularName);
            let intensityLocation = gl.getUniformLocation(gl.program, intensityName);
            let lightTypeLocation = gl.getUniformLocation(gl.program, lightTypeName);
            let distanceFunctionLocation = gl.getUniformLocation(gl.program, distanceFunctionName);

            mapLocation.set(`position[${i}]`, positionLocation);
            mapLocation.set(`diffuseColor[${i}]`, diffuseLocation);
            mapLocation.set(`specularColor[${i}]`, specularLocation);
            mapLocation.set(`intensity[${i}]`, intensityLocation);
            mapLocation.set(`lightType[${i}]`, lightTypeLocation);
            mapLocation.set(`attenuationFunction[${i}]`, distanceFunctionLocation);
        }

        this.lightLocations.set(gl.program, mapLocation);

        // find the light number locations
        let numLocation = gl.getUniformLocation(gl.program, "u_lightBuffer.numLights");
        this.lightNumLocations.set(gl.program, numLocation);

        // find the ambient light locations
        let ambientLocation = gl.getUniformLocation(gl.program, "u_lightBuffer.ambientLight");
        this.ambientLightLocations.set(gl.program, ambientLocation);

        let ambientIntensityLocation = gl.getUniformLocation(gl.program, "u_lightBuffer.ambientIntensity");
        this.ambientLightIntensityLocations.set(gl.program, ambientIntensityLocation);
    }

    foreachLight(callback) {
        for (let i = 0; i < this.lights.length; i++) {
            callback(this.lights[i]);
        }
    }
}