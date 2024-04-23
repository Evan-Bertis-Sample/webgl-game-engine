// terrain.js
// used to generate the terrain
//

// generate a plane mesh with the given width, height, and resolution
// the resolution refers to the number of subdivisions in the plane
function generatePlaneMesh(width, height, resolution)
{
    let mesh = new Mesh();
    let vertices = [];
    let normals = [];
    let uvs = [];
    let vertexIndices = [];
    let normalIndices = [];
    let uvIndices = [];

    // generate the vertices
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let x = i / resolution * width;
            let z = j / resolution * height;
            let y = 0;
            vertices.push(new Vector4([x, y, z, 1.0]));
            normals.push(new Vector4([0, 1, 0, 0]));
            uvs.push(new Vector3([i / resolution, j / resolution, 0]));
        }
    }


    // generate the indices
    for (let i = 0; i < resolution - 1; i++) {
        for (let j = 0; j < resolution - 1; j++) {
            let index = i * resolution + j;
            vertexIndices.push(index);
            vertexIndices.push(index + 1);
            vertexIndices.push(index + resolution);
            vertexIndices.push(index + 1);
            vertexIndices.push(index + resolution);
            vertexIndices.push(index + resolution + 1);

            normalIndices.push(index);
            normalIndices.push(index + 1);
            normalIndices.push(index + resolution);
            normalIndices.push(index + 1);
            normalIndices.push(index + resolution);
            normalIndices.push(index + resolution + 1);

            uvIndices.push(index);
            uvIndices.push(index + 1);
            uvIndices.push(index + resolution);
            uvIndices.push(index + 1);
            uvIndices.push(index + resolution);
            uvIndices.push(index + resolution + 1);

        }
    }

    mesh.setVertices(vertices);
    mesh.setNormals(normals);
    mesh.setvertexIndices(vertexIndices);
    mesh.setNormalIndices(normalIndices);

    return mesh;
}