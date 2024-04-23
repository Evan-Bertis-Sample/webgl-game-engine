// mesh.js
// Contains Mesh, MeshRegistry
//

// A representation of a mesh
// Stores the vertices, normals, and vertexIndices of the mesh
class Mesh {
    // Creates a new Mesh
    // vertices: an array of Vector3s
    // normals: an array of Vector3s
    // vertexIndices: an array of vertexIndices that map to the vertices and normals to form triangles -- triangles should be wound counter-clockwise
    constructor(vertices, normals, uvs, vertexIndices, normalIndices, uvIndices) {
        this.vertices = vertices;
        this.normals = normals;
        this.uvs = uvs;
        this.vertexIndices = vertexIndices;
        this.normalIndices = normalIndices;
        this.uvIndices = uvIndices;

        // stores the start indices of the mesh in the vertex, normal, and index buffers
        this.vertexStartIndex = -1;
        this.normalStartIndex = -1;
        this.indexStartIndex = -1;
    }

    // Sets the vertices of this mesh
    // vertices: an array of vertices
    setVertices(vertices) {
        this.vertices = vertices;
    }

    // Sets the normals of this mesh
    // normals: an array of normals
    setNormals(normals) {
        this.normals = normals;
    }

    // Sets the vertexIndices of this mesh
    // vertexIndices: an array of vertexIndices
    setvertexIndices(vertexIndices) {
        this.vertexIndices = vertexIndices;
    }

    // Sets the normalIndices of this mesh
    // normalIndices: an array of normalIndices
    setNormalIndices(normalIndices) {
        this.normalIndices = normalIndices;
    }

    // prints the mesh to the console
    print() {
        console.log("Vertices: ");
        for (var i = 0; i < this.vertices.length; i++) {
            console.log(this.vertices[i]);
        }
        console.log("Normals: ");
        for (var i = 0; i < this.normals.length; i++) {
            console.log(this.normals[i]);
        }
        console.log("vertexIndices: ");
        for (var i = 0; i < this.vertexIndices.length; i++) {
            console.log(this.vertexIndices[i]);
        }
    }

    // Loads the mesh using the given gl context
    // vertexBuffer : a list of Vector4s representing the vertices
    // normalBuffer : a list of Vector4s representing the normals
    // indexBuffer : a list of vertexIndices
    loadObject(vertexBuffer, normalBuffer, uvBuffer)
    {
        if (this.vertexStartIndex != -1) {
            // already loaded
            // console.log("Mesh already loaded");
            return;
        }

        this.vertexStartIndex = vertexBuffer.length;
        for (var i = 0; i < this.vertexIndices.length; i++) {
            let vertexIndex = this.vertexIndices[i];
            let vertex = this.vertices[vertexIndex];

            let posVec = new Vector4([vertex.elements[0],
                                      vertex.elements[1],
                                      vertex.elements[2],
                                      1]);
            vertexBuffer.push(posVec);
        }

        this.normalStartIndex = normalBuffer.length;
        for (var i = 0; i < this.normalIndices.length; i++) {
            let normalIndex = this.normalIndices[i];
            let normal = this.normals[normalIndex];

            let normalVec = new Vector4([normal.elements[0],
                                         normal.elements[1],
                                         normal.elements[2],
                                         0]);
            normalBuffer.push(normalVec);
        }

        this.uvStartIndex = uvBuffer.length;
        for (var i = 0; i < this.uvIndices.length; i++) {
            let uvIndex = this.uvIndices[i];
            let uv = this.uvs[uvIndex];

            uvBuffer.push(new Vector3([uv.elements[0], uv.elements[1], 0]));
        }
    }

    // Draws the mesh using the given gl context
    // gl : the gl context
    draw(gl) {
        if (this.vertexStartIndex == -1) {
            // not loaded
            console.log("Mesh not loaded");
            return;
        }

        // console.log("Drawing mesh");
        let vertexCount = this.vertexIndices.length;
        gl.drawArrays(gl.TRIANGLES, this.vertexStartIndex, vertexCount);
    }

}

// A representation of a mesh registry
// Stores a map of meshes
class MeshRegistry {
    // Creates a new MeshRegistry
    constructor() {
        this.meshes = new Map();
    }

    // Adds a mesh to the registry
    // name: the name of the mesh
    // mesh: the mesh to add
    addMesh(name, mesh) {
        this.meshes.set(name, mesh);
    }

    // Gets a mesh from the registry
    // name: the name of the mesh
    // returns the mesh
    getMesh(name) {
        return this.meshes.get(name);
    }

    // Loads a collection of meshes from an array of file paths, and adds them to the registry
    // filePaths: an array of file paths
    async loadMeshes(filePaths) {
        for (var i = 0; i < filePaths.length; i++) {
            await this.loadMesh(filePaths[i]);
        }
    }

    // Loads a mesh from a file, and adds it to the registry
    // name: the location of the mesh file
    // returns the mesh name to access the mesh from the registry
    async loadMesh(filePath) {
        // check if this file exists using fetch
        try {
            let source = await loadFile(filePath);

            if (source == null) {
                console.log("Failed to load mesh: " + filePath);
                return;
            }

            let mesh = this.parseMesh(source);

            // get the name of the mesh
            let name = filePath.split("/")[filePath.split("/").length - 1];
            // remove the file extension
            name = name.split(".")[0];

            console.log("Loaded mesh: " + name);
            // add the mesh to the registry
            this.addMesh(name, mesh);
            return name;
        }
        catch (error) {
            console.log("Failed to load mesh: " + filePath);
            console.log(error);
        }
    }

    // Parses a mesh from a string
    // source: the string to parse the mesh from -- should be in the obj format
    // returns the mesh
    parseMesh(source) {
        let vertices = [];
        let normals = [];
        let uvs = [];
        let vertexIndices = [];
        let normalIndices = [];
        let uvIndices = [];

        let lines = source.split("\n");

        for (var i = 0; i < lines.length; i++) {
            let line = lines[i];
            let tokens = line.split(" ");

            if (tokens[0] == "v") {
                // vertex
                let x = parseFloat(tokens[1]);
                let y = parseFloat(tokens[2]);
                let z = parseFloat(tokens[3]);
                let vertex = new Vector3([x, y, z]);
                vertices.push(vertex);
            }
            else if (tokens[0] == "vn") {
                // normal
                let x = parseFloat(tokens[1]);
                let y = parseFloat(tokens[2]);
                let z = parseFloat(tokens[3]);
                let normal = new Vector3([x, y, z]);
                normals.push(normal);
            }
            else if (tokens[0] == "f") {
                // face
                let v1 = parseInt(tokens[1].split("/")[0]) - 1;
                let v2 = parseInt(tokens[2].split("/")[0]) - 1;
                let v3 = parseInt(tokens[3].split("/")[0]) - 1;
                vertexIndices.push(v1);
                vertexIndices.push(v2);
                vertexIndices.push(v3);

                let n1 = parseInt(tokens[1].split("/")[2]) - 1;
                let n2 = parseInt(tokens[2].split("/")[2]) - 1;
                let n3 = parseInt(tokens[3].split("/")[2]) - 1;
                normalIndices.push(n1);
                normalIndices.push(n2);
                normalIndices.push(n3);
            }
            else if (tokens[0] == "vt") {
                // uv
                let u = parseFloat(tokens[1]);
                let v = parseFloat(tokens[2]);
                let uv = new Vector3([u, v, 0]);
                uvs.push(uv);
            }
        }

        let mesh = new Mesh(vertices, normals, uvs, vertexIndices, normalIndices, uvIndices);
        // console.log("Loaded mesh: ");
        // console.log(mesh);
        return mesh;
    }
}