
export const terrainVertexShader = `
// Variables that are passed in from the JavaScript
uniform float uDisplacementScale;
uniform sampler2D uDisplacementMap;

// Values that will be passed to the fragment shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Pass the UV coordinates to the fragment shader
  vUv = uv;
  
  // Get displacement from the texture
  float displacement = texture2D(uDisplacementMap, uv).r * uDisplacementScale;
  
  // Displace the vertex along the normal
  vec3 newPosition = position + normal * displacement;
  
  // Calculate the transformed normal for lighting
  vNormal = normalize(normalMatrix * normal);
  
  // Pass the position to the fragment shader
  vPosition = newPosition;
  
  // Set the final position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const terrainFragmentShader = `
uniform sampler2D uTexture;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uAmbientLight;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Get the base color from the texture
  vec4 textureColor = texture2D(uTexture, vUv);
  
  // Calculate diffuse lighting
  vec3 lightDir = normalize(uLightPos - vPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;
  
  // Combine lighting with texture color
  vec3 finalColor = (uAmbientLight + diffuse) * textureColor.rgb;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
