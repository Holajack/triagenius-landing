
export const fragmentShader = `
varying vec2 vUv;
varying float vElevation;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vPathColors[5];
varying float vPathIntensities[5];

void main() {
  float snowLevel = 3.8;
  float highRockLevel = 3.0;
  float midRockLevel = 2.3;
  float lowRockLevel = 1.5;
  float grassLevel = 0.8;
  float sandLevel = 0.3;
  float waterLevel = 0.0;
  float deepWaterLevel = -0.5;
  
  // Enhanced color palette
  vec3 snowColor = vec3(0.95, 0.98, 0.99);
  vec3 highRockColor = vec3(0.58, 0.55, 0.53);
  vec3 midRockColor = vec3(0.65, 0.61, 0.57);
  vec3 lowRockColor = vec3(0.75, 0.70, 0.64);
  vec3 grassColor = vec3(0.48, 0.60, 0.35);
  vec3 sandColor = vec3(0.82, 0.76, 0.56);
  vec3 mudColor = vec3(0.64, 0.55, 0.44);
  vec3 pathColor = vec3(0.85, 0.73, 0.58);
  vec3 waterColor = vec3(0.25, 0.45, 0.85);
  vec3 deepWaterColor = vec3(0.15, 0.25, 0.65);
  
  // Add texture details with noise
  float noiseVal = fract(sin(vUv.x * 100.0 + vUv.y * 100.0) * 10000.0) * 0.05;
  float bandNoise = sin(vElevation * 10.0) * 0.02;
  
  // Determine terrain color based on elevation
  vec3 terrainColor;
  
  if (vElevation > snowLevel) {
    // Snow caps
    terrainColor = snowColor;
    
    // Add sparkle to snow
    if (fract(sin(vUv.x * 200.0 + vUv.y * 150.0) * 20000.0) > 0.97) {
      terrainColor += vec3(0.1);
    }
  } else if (vElevation > highRockLevel) {
    // High mountain rocks
    float blend = (vElevation - highRockLevel) / (snowLevel - highRockLevel);
    terrainColor = mix(highRockColor, snowColor, blend);
  } else if (vElevation > midRockLevel) {
    // Mid-level rocks
    float blend = (vElevation - midRockLevel) / (highRockLevel - midRockLevel);
    terrainColor = mix(midRockColor, highRockColor, blend);
  } else if (vElevation > lowRockLevel) {
    // Low rocks
    float blend = (vElevation - lowRockLevel) / (midRockLevel - lowRockLevel);
    terrainColor = mix(lowRockColor, midRockColor, blend);
  } else if (vElevation > grassLevel) {
    // Grassy areas
    float blend = (vElevation - grassLevel) / (lowRockLevel - grassLevel);
    terrainColor = mix(grassColor, lowRockColor, blend);
  } else if (vElevation > sandLevel) {
    // Sandy beaches
    float blend = (vElevation - sandLevel) / (grassLevel - sandLevel);
    terrainColor = mix(sandColor, grassColor, blend);
  } else if (vElevation > waterLevel) {
    // Shorelines and paths
    float blend = (vElevation - waterLevel) / (sandLevel - waterLevel);
    terrainColor = mix(mudColor, sandColor, blend);
  } else if (vElevation > deepWaterLevel) {
    // Shallow water
    float blend = (vElevation - deepWaterLevel) / (waterLevel - deepWaterLevel);
    terrainColor = mix(deepWaterColor, waterColor, blend);
    
    // Add water ripples
    float ripples = sin(vUv.x * 80.0 + vUv.y * 80.0) * 0.01;
    terrainColor += vec3(ripples);
  } else {
    // Deep water
    terrainColor = deepWaterColor;
  }
  
  // Add subtle texture variations
  terrainColor += vec3(noiseVal + bandNoise);
  
  // Overlay brain region trails on the terrain
  vec3 pathColorContribution = vec3(0.0);
  float totalPathIntensity = 0.0;
  
  // Mix in each brain region path color based on its intensity
  for (int i = 0; i < 5; i++) {
    pathColorContribution += vPathColors[i] * vPathIntensities[i] * 1.2;
    totalPathIntensity += vPathIntensities[i];
  }
  
  // Blend path colors with terrain
  if (totalPathIntensity > 0.0) {
    // Add glow effect to paths
    float glow = min(totalPathIntensity * 1.5, 1.0);
    terrainColor = mix(terrainColor, pathColorContribution, glow);
    
    // Add subtle pulse effect to paths
    terrainColor *= 1.0 + (totalPathIntensity * 0.3);
  }
  
  // Add simple lighting effect based on normal
  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.3 + 0.7;
  terrainColor *= diffuse;
  
  // Enhance overall lighting
  terrainColor = terrainColor * 1.1;
  
  // Add atmospheric fog effect for depth
  float fog = 1.0 - smoothstep(0.0, 1.0, distance(vUv, vec2(0.5)));
  terrainColor = mix(terrainColor, vec3(0.85, 0.8, 0.75), (1.0 - fog) * 0.2);
  
  gl_FragColor = vec4(terrainColor, 1.0);
}
`;
