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

struct LightBuffer
{
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

const float cellShadingWeight = 0.4;
const float diffuseSteps = 4.0;
const float specularSteps = 3.0;
const float frenselSteps = 16.0;

const float gridSize = 0.5;
const vec4 gridColor = vec4(0.6, 0.52, 0.85, 1.0);

uniform vec4 u_color;
uniform vec3 u_cameraPosition;
uniform vec4 u_frensel_color;
uniform float u_frensel_border;
uniform float u_show_grid;

// varying variables -- passed from vertex shader
varying vec4 v_position;
varying vec4 v_normal;
varying float v_enable_lighting;
varying vec2 v_uv;


float nStep(float x, float numSteps) {
    return floor(x * numSteps) / float(numSteps);
}

vec4 lerp(vec4 a, vec4 b, float t) {
    return a * (1.0 - t) + b * t;
}

float calculateAttenuation(Light light, float lightDistance)
{
    if (light.attenuationFunction == 0)
    {
        return 3.0 / lightDistance;
    }
    else if (light.attenuationFunction == 1)
    {
        return 3.0 / (lightDistance * lightDistance);
    }
    else if (light.attenuationFunction == 2)
    {
        return 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);
    }
    else
    {
        return 1.0;
    }
}  

vec3 calculatePointLightDiffuse(Light light, vec4 position, vec4 normal) {
    vec3 lightDirection = normalize(light.position - position.xyz);
    float lightDistance = length(light.position - position.xyz);
    float attenuation = calculateAttenuation(light, lightDistance);
    float diffuse = max(dot(normal.xyz, lightDirection), 0.0);

    // nstep the diffuse value
    diffuse = nStep(diffuse, diffuseSteps) * cellShadingWeight + diffuse * (1.0 - cellShadingWeight);

    return diffuse * attenuation * light.intensity * light.diffuseColor;
}

vec3 calculatePointLightSpecular(Light light, vec4 v_position, vec4 normal)
{
    vec3 lightDirection = normalize(light.position - v_position.xyz);
    vec3 viewDirection = normalize(u_cameraPosition - v_position.xyz);
    vec3 reflectDirection = reflect(-lightDirection, normal.xyz);
    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
    float lightDistance = length(light.position - v_position.xyz);
    float attenuation = calculateAttenuation(light, lightDistance);

    // nstep the specular value
    specular = nStep(specular, specularSteps) * cellShadingWeight + specular * (1.0 - cellShadingWeight);

    return specular * attenuation * light.intensity * light.specularColor;
}

vec3 calculateDirectionalLightDiffuse(Light light, vec4 position, vec4 normal)
{
    vec3 lightDirection = normalize(-light.position);
    float diffuse = max(dot(normal.xyz, lightDirection), 0.0);
    
    // nstep the diffuse value
    diffuse = nStep(diffuse, diffuseSteps) * cellShadingWeight + diffuse * (1.0 - cellShadingWeight);

    return diffuse * light.intensity * light.diffuseColor;
}


vec3 calculateDirectionalLightSpecular(Light light, vec4 position, vec4 normal)
{
    vec3 lightDirection = normalize(-light.position);
    vec3 viewDirection = normalize(u_cameraPosition - position.xyz);
    vec3 reflectDirection = reflect(-lightDirection, normal.xyz);
    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);

    // nstep the specular value
    specular = nStep(specular, specularSteps) * cellShadingWeight + specular * (1.0 - cellShadingWeight);

    return specular * light.intensity * light.specularColor;
}

void main() {
    // normalize the normal vector
    vec4 normal = normalize(v_normal);

    if(v_enable_lighting == 0.0) {
        vec4 normalColor = vec4(normal.x, normal.y, normal.z, 1.0) * 0.5 + 0.5;
        // mix the normal color with the object color
        gl_FragColor = normalColor;
        return;
    }

    // Initial color setup
    vec4 color = u_color;
    if(v_enable_lighting != 0.0) {
        vec4 diffuseLight = vec4(0.0);
        vec4 specularLight = vec4(0.0);

        for(int i = 0; i < 16; i++) {
            if(i >= u_lightBuffer.numLights) {
                break;
            }
            Light light = u_lightBuffer.lights[i];
            if(light.lightType == 0) { // Point light
                diffuseLight += vec4(calculatePointLightDiffuse(light, v_position, normal), 1.0);
                specularLight += vec4(calculatePointLightSpecular(light, v_position, normal), 1.0);
            } else { // Directional light
                diffuseLight += vec4(calculateDirectionalLightDiffuse(light, v_position, normal), 1.0);
                specularLight += vec4(calculateDirectionalLightSpecular(light, v_position, normal), 1.0);
            }
        }

        // Calculate the Fresnel effect
        vec4 viewDirection = normalize(vec4(u_cameraPosition, 1.0) - v_position);
        float frensel = 1.0 - dot(normal, viewDirection);
        frensel = pow(frensel, 1.0 / u_frensel_border);

        // nstep the fresnel value
        frensel = nStep(frensel, frenselSteps) * cellShadingWeight + frensel * (1.0 - cellShadingWeight);

        vec4 frenselColor = u_frensel_color * frensel;

        color = u_color * vec4(u_lightBuffer.ambientLight * u_lightBuffer.ambientIntensity, 1.0);
        color += (diffuseLight * u_diffuse_influence);
        color += frenselColor * u_frensel_influence;
        color += specularLight * u_specular_influence;
    }

    // add a grid to the object, based on x and z coordinates, but only if the normal is pointing up
    float grid = 0.0;
    if(mod(v_position.x, gridSize * 10.0) < gridSize || mod(v_position.z, gridSize * 10.0) < gridSize) {
        grid = 1.0;
    }

    // multiply it by the dot product of the normal and the up vector

    if(u_show_grid > 0.0) {
        grid *= max(dot(normal, vec4(0, 1, 0, 0)), 0.0);

        // multiply the grid by the distance from the origin
        grid *= 1.0 - (length(v_position) / 60.0);

        // clamp the grid value
        grid = clamp(grid, 0.0, 1.0);

        // now lerping the grid color with the final color
        color = lerp(color, gridColor, grid);
    }

    gl_FragColor = color;
}