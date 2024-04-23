// material.js
// An abstraction of a material for a 3D object
// Stores a material's fragment and vertex shaders

// Used to describe a shader parameter passed in as a uniform using WebGl
class MaterialParameter {
    constructor(name = "", value = null) {
        this.name = name;
        this.value = value;
    }

    // loads the parameter into the shader
    loadParameter(gl, location) {
        if (this.value == null) {
            console.log("Shader parameter is null");
            return;
        }

        if (location < 0) {
            console.log("Shader parameter location is null");
            return;
        }

        if (this.value instanceof Vector3) {
            gl.uniform3fv(location, this.value.elements);
        }
        else if (this.value instanceof Vector4) {
            gl.uniform4fv(location, this.value.elements);
        }
        else if (this.value instanceof Matrix4) {
            console.log("Loading matrix: " + this.name + " into shader");
            gl.uniformMatrix4fv(location, false, this.value.elements);
        }
        else if (Number.isFinite(this.value)) {
            gl.uniform1f(location, this.value);
        }
        else {
            console.log("Shader parameter type not supported");
            return;
        }
    }
}

// Used to load shaders and create a material instance
class MaterialDescriptor {
    constructor(name = "", shaderDirectory = "", params = new Array()) {
        this.name = name;
        this.shaderDirectory = shaderDirectory;
        this.params = params;
    }

    // Finds whether or not a material has a parameter of a given name
    hasParam(name) {
        for (let i = 0; i < this.params.length; i++) {
            // console.log("Checking parameter: " + this.params[i].name + " against " + name);
            if (this.params[i].name == name) {
                // console.log("Found parameter: " + name);
                return true;
            }
        }
        return false;
    }

    addParam(param) {
        this.params.push(param);
    }
}

// ShaderSet
// Used to pair a vertex and fragment shader together, as well as storing the position of common shader parameters
class ShaderSet {
    constructor(name, vertexShaderSource = "", fragmentShaderSource = "", paramNames = new Array()) {
        this.name = name;
        this.vertexShaderSource = vertexShaderSource;
        this.fragmentShaderSource = fragmentShaderSource;
        this.paramNames = paramNames;
        this.uLoc_modelMatrix = new Map(); // map from a canvas id to the location
        this.uLoc_viewMatrix = new Map(); // map from a canvas id to the location
        this.uLoc_projectionMatrix = new Map(); // map from a canvas id to the location
        this.uLoc_cameraPosition = new Map(); // map from a canvas id to the location
        this.uLoc_params = new Map(); // map from a canvas id to a map of parameter names to locations
    }

    loadShader(gl) {
        console.log("Loading shader: " + this.name);
        initShaders(gl, this.vertexShaderSource, this.fragmentShaderSource);
        // set the attributes
        var aLoc_position = gl.getAttribLocation(gl.program, 'a_position');
        if (aLoc_position < 0) {
            console.log('Failed to get the storage location of a_position');
            console.log("aLoc_position: " + aLoc_position);
            return;
        }

        var aLoc_normal = gl.getAttribLocation(gl.program, 'a_normal');
        if (aLoc_normal < 0) {
            console.log('Failed to get the storage location of a_normal');
            console.log("aLoc_normal: " + aLoc_normal);
            return;
        }

        var aloc_uv = gl.getAttribLocation(gl.program, 'a_uv');
        if (aloc_uv < 0) {
            console.log('Failed to get the storage location of a_uv');
            console.log("aloc_uv: " + aloc_uv);
            return;
        }

        // the vertex buffer is sorted as follows:
        // vertex, normal, vertex, normal, etc.
        // this was loaded initially before loading the shaders
        // set the vertex attribute pointer
        // vertexAttribPointer(index, size, type, normalized, stride, offset)
        gl.vertexAttribPointer(aLoc_position, 4, gl.FLOAT, false, 10 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(aLoc_position);

        // set the normal attribute pointer
        gl.vertexAttribPointer(aLoc_normal, 4, gl.FLOAT, false, 10 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(aLoc_normal);

        // set the uv attribute pointer
        gl.vertexAttribPointer(aloc_uv, 2, gl.FLOAT, false, 10 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(aloc_uv);

        // get location of the uniform variables
        let uLoc_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
        if (uLoc_modelMatrix < 0) {
            console.log('Failed to get the storage location of u_modelMatrix');
            return;
        }
        this.uLoc_modelMatrix.set(gl.program, uLoc_modelMatrix);

        let uLoc_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix');
        if (uLoc_viewMatrix < 0) {
            console.log('Failed to get the storage location of u_viewMatrix');
            return;
        }

        this.uLoc_viewMatrix.set(gl.program, uLoc_viewMatrix);

        let uLoc_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix');
        if (uLoc_projectionMatrix < 0) {
            console.log('Failed to get the storage location of u_projectionMatrix');
            return;
        }

        this.uLoc_projectionMatrix.set(gl.program, uLoc_projectionMatrix);

        let uLoc_cameraPosition = gl.getUniformLocation(gl.program, 'u_cameraPosition');
        if (uLoc_cameraPosition < 0) {
            console.log('Failed to get the storage location of u_cameraPosition');
            return;
        }

        this.uLoc_cameraPosition.set(gl.program, uLoc_cameraPosition);

        // now find the locations of the shader parameters
        for (let i = 0; i < this.paramNames.length; i++) {
            let paramName = this.paramNames[i];
            console.log("Finding parameter " + paramName);
            let location = gl.getUniformLocation(gl.program, paramName);
            if (location == null || location < 0) {
                console.log('Failed to get the storage location of ' + paramName);
                continue;
            }
            if (!this.uLoc_params.has(gl.program)) {
                // create a new map for this parameter
                console.log("Creating new map for shader: " + gl.program);
                this.uLoc_params.set(gl.program, new Map());
            }

            this.uLoc_params.get(gl.program).set(paramName, location);
        }
    }

    loadParameters(gl, params) {
        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            // console.log("Loading parameter: " + param.name);
            // get the location of the parameter
            if (this.uLoc_params.get(gl.program) == null) continue;
            
            let location = this.uLoc_params.get(gl.program).get(param.name);
            if (location == null || location < 0) {
                // console.log('Failed to get the storage location of ' + param.name);
                continue;
            }
            param.loadParameter(gl, location);
        }

        g_lightRegistry.loadLights(gl)
    }
}

// A representation of a material
// Stores the name of the material, the name of the shader, and the parameters
class Material {
    // name: the name of the material
    // shaderName: the name of the shader used
    // params: an array of MaterialParameter objects
    constructor(name, shaderName, params = new Array()) {
        this.name = name;
        this.shaderName = shaderName;
        this.params = params;
    }

    // loads the material into the shader
    loadParameters(gl, shader) {
        shader.loadParameters(gl, this.params);
    }

    getParam(paramName) {
        for (let i = 0; i < this.params.length; i++) {
            if (this.params[i].name == paramName) {
                return this.params[i];
            }
        }
        return null;

    }
}

// A registry of materials and shaders
// Used to load and store materials and shaders
// Also used to set the current material and pass uniforms to the shader
class MaterialRegistry {
    constructor(materialDescriptors = new Array(), defaultParams = new Map()) {
        this.materials = new Map();
        this.shaders = new Map();
        this.materialDescriptors = materialDescriptors;
        this.currentlyLoadedMaterial = new Map(); // maps from canvasID to material name
        this.currentlyLoadedShader = new Map(); // maps from canvasID to shader name
        this.defaultParams = defaultParams; // maps from shader name to list of material descriptors
    }

    print() {
        console.log("Printing materials");
        for (let [key, value] of this.materials) {
            console.log(key)
            console.log(value)
        }

        console.log("Printing shaders");
        for (let [key, value] of this.shaders) {
            console.log(key)
            console.log(value)
        }
    }

    // loads all the materials from the shader directory
    // the shader directory should be laid out as follows:
    //  shaderDirectory
    //      material1 -> whatever the material is called
    //          vert.glsl -> the vertex shader
    //          frag.glsl -> the fragment shader
    //      material2
    //          vert.glsl
    //          frag.glsl
    //      ...
    // If the shader directory is not laid out like this, then the materials will not be loaded correctly
    async loadMaterials() {
        // Get all the materials in the shader directory
        // using FileReader
        var materialDescriptors = this.materialDescriptors;
        console.log("Found " + materialDescriptors.length + " materials");
        console.log(materialDescriptors);
        // For each material directory, load it into the shader registry
        for (var i = 0; i < materialDescriptors.length; i++) {
            // parse materialLocation to get the name of the shader
            let shaderLocation = materialDescriptors[i].shaderDirectory;
            let shaderName = shaderLocation.split("/").pop(); // get the last element
            let materialName = materialDescriptors[i].name;
            if (shaderName == "") {
                console.log("Failed to load material: " + materialName);
                console.log("Shader name is empty");
                continue;
            }

            // load the shader because it hasn't been loaded yet
            if (!this.shaders.has(shaderName)) {
                // load the shader from the path
                let vertexShaderPath = shaderLocation + "/vert.glsl";
                let fragmentShaderPath = shaderLocation + "/frag.glsl";

                // check if these files exist using fetch
                try {
                    console.log("Loading shader: " + shaderName);
                    const vertSource = await loadFile(vertexShaderPath);
                    const fragSource = await loadFile(fragmentShaderPath);

                    // console.log(vertSource)
                    // console.log(fragSource)

                    let paramNames = new Array();
                    for (let j = 0; j < materialDescriptors[i].params.length; j++) {
                        paramNames.push(materialDescriptors[i].params[j].name);
                    }

                    // add parameters into the material descriptor params, if they aren't listed
                    // add the missing parameters
                    let defaultParams = this.defaultParams.get(shaderName);
                    if (defaultParams != null) {
                        for (let j = 0; j < defaultParams.length; j++) {
                            let defaultParamName = defaultParams[j].name;
                            // add this to the param names if it is not in there
                            let found = false;
                            for (let k = 0; k < paramNames; k++) {
                                let cur = defaultParamName[k]
                                if (cur == defaultParamName) {
                                    found = true;
                                    break;
                                }
                            }

                            if (!found)
                                paramNames.push(defaultParamName)
                        }
                    }
                    console.log(paramNames)

                    // add the shader to the registry
                    let shader = new ShaderSet(shaderName, vertSource, fragSource, paramNames);
                    console.log(shader);
                    this.addShader(shader);
                }
                catch (error) {
                    console.log("Failed to load material: " + materialName);
                    console.log(error);
                }
            }

            // add parameters into the material descriptor params, if they aren't listed
            // add the missing parameters
            let finalParams = materialDescriptors[i].params.slice()
            console.log(materialDescriptors[i])
            let defaultParams = this.defaultParams.get(shaderName);
            if (defaultParams != null) {
                for (let j = 0; j < defaultParams.length; j++) {
                    let defaultParam = defaultParams[j];
                    // console.log(defaultParam);
                    if (!materialDescriptors[i].hasParam(defaultParam.name)) {
                        // console.log(`Adding default parameter ${defaultParam.name} of value ${defaultParam.value} to material ${materialName}`)
                        finalParams.push(defaultParam)
                    }
                }
            }
            // add the material to the registry
            console.log(finalParams)

            var material = new Material(materialName, shaderName, finalParams);
            this.addMaterial(material);
        }
    }

    addMaterial(material) {
        this.materials.set(material.name, material);
    }

    getMaterial(name) {
        return this.materials.get(name);
    }

    addShader(shader) {
        this.shaders.set(shader.name, shader);
    }
    getShader(name) {
        return this.shaders.get(name);
    }

    setGlobalParam(name, value) {
        for (let [key, material] of this.materials) {
            for (let i = 0; i < material.params.length; i++) {
                if (material.params[i].name == name) {
                    material.params[i].value = value;
                    break;
                }
            }

            // didn't find the param, add a new one
            material.params.push(new MaterialParameter(name, value));
        }
    }

    async setGlobalShader(name) {
        // set the shaderName for all materials
        await this.loadShaderSource(name)
        for (let [key, material] of this.materials) {
            material.shaderName = name;
        }
    }

    async loadShaderSource(shaderName) {
        // loads a shaderset
        // load the shader because it hasn't been loaded yet
        if (this.shaders.has(shaderName)) return;
        let shaderLocation = "static/materials/" + shaderName;
        // load the shader from the path
        let vertexShaderPath = shaderLocation + "/vert.glsl";
        let fragmentShaderPath = shaderLocation + "/frag.glsl";

        console.log(vertexShaderPath)

        // check if these files exist using fetch
        try {
            console.log("Loading shader: " + shaderName);
            const vertSource = await loadFile(vertexShaderPath);
            const fragSource = await loadFile(fragmentShaderPath);

            // add parameters into the material descriptor params, if they aren't listed
            // add the missing parameters
            let paramNames = []
            let defaultParams = this.defaultParams.get(shaderName);
            if (defaultParams != null) {
                for (let j = 0; j < defaultParams.length; j++) {
                    let defaultParamName = defaultParams[j].name;
                    // add this to the param names if it is not in there
                    let found = false;
                    for (let k = 0; k < paramNames; k++) {
                        let cur = defaultParamName[k]
                        if (cur == defaultParamName) {
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                        paramNames.push(defaultParamName)
                }
            }
            // add the shader to the registry
            let shader = new ShaderSet(shaderName, vertSource, fragSource, paramNames);
            this.addShader(shader);

        }
        catch (error) {
            console.log("Failed to load shader: " + shaderName);
            console.log(error);
        }
    }


    // sets the material to use for the next object
    // name: the name of the material
    setMaterial(name, gl) {
        if (this.currentlyLoadedMaterial.get(gl) == name) {
            // console.log("Skipping material loading");
            return;
        }
        // console.log("Setting material: " + name + " for canvas: " + gl);

        let material = this.getMaterial(name);
        if (material == null) {
            console.log("Can't set material, material is null");
            return;
        }

        this.currentlyLoadedMaterial.set(gl, name);

        // load the shader
        let shader = this.shaders.get(material.shaderName);
        if (material.shaderName != this.currentlyLoadedShader.get(gl)) {
            // console.log("Switching to shader: " + material.shaderName);
            if (shader == null) {
                console.log("Can't set material, shader is null");
                return;
            }
            shader.loadShader(gl);
            this.currentlyLoadedShader.set(gl, material.shaderName);
        }
        else {
            // console.log("Skipping shader loading");
        }

        // console.log("Setting material: " + name);
        material.loadParameters(gl, shader);
    }

    // sets the material parameters for the next object
    // these are all the uniforms that any material should have
    passUniforms(gl, modelMatrix, viewMatrix, projectionMatrix, cameraPosition) {
        let material = this.getMaterial(this.currentlyLoadedMaterial.get(gl));
        // console.log(material);
        if (material == null) {
            console.log("Can't pass uniforms, material is null");
            return;
        }

        let shader = this.getShader(material.shaderName);
        // console.log(shader);
        if (shader == null) {
            console.log("Can't read shader, shader is null");
            return;
        }

        let uLoc_modelMatrix = shader.uLoc_modelMatrix.get(gl.program);
        let uLoc_viewMatrix = shader.uLoc_viewMatrix.get(gl.program);
        let uLoc_projectionMatrix = shader.uLoc_projectionMatrix.get(gl.program);
        let uLoc_cameraPosition = shader.uLoc_cameraPosition.get(gl.program);

        if (uLoc_modelMatrix < 0) {
            console.log("Material Model Matrix is null");
            return;
        }

        if (uLoc_viewMatrix < 0) {
            console.log("Material View Matrix is null");
            return;
        }

        if (uLoc_projectionMatrix < 0) {
            console.log("Material Projection Matrix is null");
            return;
        }

        if (uLoc_cameraPosition < 0) {
            console.log("Camera Position is null");
            return;
        }

        // console.log("Passing uniforms for material: " + this.currentlyLoadedMaterial)
        gl.uniformMatrix4fv(uLoc_modelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(uLoc_viewMatrix, false, viewMatrix.elements);
        gl.uniformMatrix4fv(uLoc_projectionMatrix, false, projectionMatrix.elements);
        gl.uniform3fv(uLoc_cameraPosition, cameraPosition.elements);
    }
}
