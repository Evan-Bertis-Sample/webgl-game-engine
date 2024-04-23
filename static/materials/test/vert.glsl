// base_vert.glsl
// Contains a basic vertex shader

// Vertex shader inputs
attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec2 a_uv;

// uniforms
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;
uniform float u_enable_lighting;

// varying variables
varying vec4 v_position;
varying vec4 v_normal;
varying float v_enable_lighting;
varying vec2 v_uv;

// main
void main() {
    // Transform the vertex position into screen space
    mat4 mvp = u_projectionMatrix * u_viewMatrix * u_modelMatrix;
    vec4 pos = mvp * a_position;

    // check that the vertex is in front of the camera
    if(pos.z < 0.0) {
        // if not, set the vertex position to the origin
        pos = vec4(0.0, 0.0, 0.0, 0.0);
    }

    pos = pos / pos.w;
    gl_Position = pos;

    // Pass the vertex position and normal to the fragment shader
    v_position = u_modelMatrix * a_position;
    if(u_enable_lighting != 0.0) {
        v_normal = u_modelMatrix * a_normal;
    } else {
        v_normal = a_normal;
    }

    // Pass the texture coordinates to the fragment shader
    v_uv = a_uv;

    // Pass the lighting flag to the fragment shader
    v_enable_lighting = u_enable_lighting;
}