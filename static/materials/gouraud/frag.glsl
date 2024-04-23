precision mediump float;

// varying variables -- passed from vertex shader
varying vec4 v_color;
varying vec4 v_position;
varying vec2 v_uv;
varying vec4 v_normal;
varying float v_enable_lighting;

uniform float u_show_grid;

const float gridSize = 0.5;
const vec4 gridColor = vec4(0.6, 0.52, 0.85, 1.0);


vec4 lerp(vec4 a, vec4 b, float t) {
    return a * (1.0 - t) + b * t;
}

// Main fragment shader program
void main() {
    // Output the color interpolated from the vertices
    // add a grid to the object, based on x and z coordinates, but only if the v_normal is pointing up
    float grid = 0.0;
    if(mod(v_position.x, gridSize * 10.0) < gridSize || mod(v_position.z, gridSize * 10.0) < gridSize) {
        grid = 1.0;
    }

    vec4 color = v_color;

    // multiply it by the dot product of the v_normal and the up vector
    if(u_show_grid > 0.0 && v_enable_lighting != 0.0) {
        grid *= max(dot(v_normal, vec4(0, 1, 0, 0)), 0.0);

        // multiply the grid by the distance from the origin
        grid *= 1.0 - (length(v_position) / 60.0);

        // clamp the grid value
        grid = clamp(grid, 0.0, 1.0);

        // now lerping the grid color with the final color
        color = lerp(color, gridColor, grid);
    }


    gl_FragColor = color;
}
