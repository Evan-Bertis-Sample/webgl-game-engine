// floating point precision
precision mediump float;

struct Light {
    vec3 position;
    vec3 diffuseColor;
    vec3 specularColor;
    float intensity;
    int lightType; // 0 for point light, 1 for directional light
    int attenuationFunction; // 0 for 1/dist, 1 for 1/dist^2, 2 for 1/(1+0.1*dist+0.01*dist^2), 3 for none
};

struct LightBuffer {
    Light lights[16];
    int numLights;
    vec3 ambientLight;
    float ambientIntensity;
};

uniform LightBuffer u_lightBuffer;
uniform float u_frensel_influence;
uniform float u_specular_influence;
uniform float u_diffuse_influence;
uniform float u_shininess;

// Vertex shader inputs
attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec2 a_uv;

// uniforms
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;
uniform float u_enable_lighting;
uniform vec3 u_cameraPosition;
uniform vec4 u_color;
uniform vec4 u_frensel_color;
uniform float u_frensel_border;

// varying variables to pass to fragment shader
varying vec4 v_color;
varying vec2 v_uv;
varying vec4 v_position;
varying vec4 v_normal;
varying float v_enable_lighting;

// sin based displacement variables
// sin based displacement variables
uniform float u_time;
uniform float u_displacement_amplitude;
uniform float u_displacement_frequency;
const float PI = 3.14159265359;

float calculateAttenuation(Light light, float lightDistance) {
    if(light.attenuationFunction == 0) {
        return 3.0 / lightDistance;
    } else if(light.attenuationFunction == 1) {
        return 3.0 / (lightDistance * lightDistance);
    } else if(light.attenuationFunction == 2) {
        return 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);
    } else {
        return 1.0;
    }
}

vec3 calculatePointLightDiffuse(Light light, vec4 position, vec4 normal) {
    vec3 lightDirection = normalize(light.position - position.xyz);
    float lightDistance = length(light.position - position.xyz);
    float attenuation = calculateAttenuation(light, lightDistance);
    float diffuse = max(dot(normal.xyz, lightDirection), 0.0);
    return diffuse * attenuation * light.intensity * light.diffuseColor;
}

vec3 calculatePointLightSpecular(Light light, vec4 v_position, vec4 normal) {
    vec3 lightDirection = normalize(light.position - v_position.xyz);
    vec3 viewDirection = normalize(u_cameraPosition - v_position.xyz);
    vec3 halfwayDir = normalize(lightDirection + viewDirection); // Calculate the halfway vector
    float lightDistance = length(light.position - v_position.xyz);
    float attenuation = calculateAttenuation(light, lightDistance);

    // Calculate the specular component using the Blinn-Phong model
    float specular = pow(max(dot(normal.xyz, halfwayDir), 0.0), u_shininess);

    return specular * attenuation * light.intensity * light.specularColor;
}

vec3 calculateDirectionalLightDiffuse(Light light, vec4 position, vec4 normal) {
    vec3 lightDirection = normalize(-light.position);
    float diffuse = max(dot(normal.xyz, lightDirection), 0.0);
    return diffuse * light.intensity * light.diffuseColor;
}

vec3 calculateDirectionalLightSpecular(Light light, vec4 position, vec4 normal) {
    vec3 lightDirection = normalize(-light.position); // Directional light direction remains the same
    vec3 viewDirection = normalize(u_cameraPosition - position.xyz);
    vec3 halfwayDir = normalize(lightDirection + viewDirection); // Calculate the halfway vector for Blinn-Phong

    // Calculate the specular component using the Blinn-Phong model
    float specular = pow(max(dot(normal.xyz, halfwayDir), 0.0), u_shininess);

    return specular * light.intensity * light.specularColor;
}

void main() {
    // Transform the vertex position into screen space
    vec4 worldPos = u_modelMatrix * a_position;
    // Displace the vertex position
    float offset = worldPos.x + worldPos.y + worldPos.z;
    float displacement = sin(offset + u_displacement_frequency * u_time) * u_displacement_amplitude;
    // displace the vertex position based on the normal
    worldPos += vec4(a_normal.xyz * displacement, 0.0);

    vec4 pos = u_projectionMatrix * u_viewMatrix * worldPos;

    // check that the vertex is in front of the camera
    if(pos.z < 0.0) {
        // if not, set the vertex position to the origin
        pos = vec4(0.0, 0.0, 0.0, 0.0);
    }

    pos = pos / pos.w;
    gl_Position = pos;

    vec4 normal = normalize(u_modelMatrix * a_normal);

    // Initial color setup
    vec4 color = u_color;
    if(u_enable_lighting != 0.0) {
        vec4 diffuseLight = vec4(0.0);
        vec4 specularLight = vec4(0.0);

        for(int i = 0; i < 16; i++) {
            if(i >= u_lightBuffer.numLights) {
                break;
            }
            Light light = u_lightBuffer.lights[i];
            if(light.lightType == 0) { // Point light
                diffuseLight += vec4(calculatePointLightDiffuse(light, worldPos, normal), 1.0);
                specularLight += vec4(calculatePointLightSpecular(light, worldPos, normal), 1.0);
            } else { // Directional light
                diffuseLight += vec4(calculateDirectionalLightDiffuse(light, worldPos, normal), 1.0);
                specularLight += vec4(calculateDirectionalLightSpecular(light, worldPos, normal), 1.0);
            }
        }

        // Calculate the Fresnel effect
        vec4 viewDirection = normalize(vec4(u_cameraPosition, 1.0) - v_position);
        float frensel = 1.0 - dot(normal, viewDirection);
        frensel = pow(frensel, 1.0 / u_frensel_border);
        vec4 frenselColor = u_frensel_color * frensel;

        color = u_color * vec4(u_lightBuffer.ambientLight * u_lightBuffer.ambientIntensity, 1.0);
        color += (diffuseLight * u_diffuse_influence);
        color += frenselColor * u_frensel_influence;
        color += specularLight * u_specular_influence;
    }
    else
    {
        color = vec4(a_normal.x, a_normal.y, a_normal.z, 1.0) * 0.5 + 0.5;
    }

    // Pass the computed color and texture coordinates to the fragment shader
    v_color = color;
    v_uv = a_uv;
    v_normal = normal;
    v_position = worldPos;
    v_enable_lighting = u_enable_lighting;
}
