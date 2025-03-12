
export const fragmentShader = `
varying vec2 vUv;
varying float vElevation;

void main() {
  float snowLevel = 3.5;
  float highRockLevel = 2.8;
  float midRockLevel = 2.0;
  float lowRockLevel = 1.2;
  float grassLevel = 0.6;
  float sandLevel = 0.2;
  float waterLevel = 0.0;
  float deepWaterLevel = -0.3;
  
  vec3 snowColor = vec3(0.95, 0.95, 0.97);
  vec3 highRockColor = vec3(0.55, 0.52, 0.5);
  vec3 midRockColor = vec3(0.62, 0.58, 0.54);
  vec3 lowRockColor = vec3(0.72, 0.67, 0.62);
  vec3 grassColor = vec3(0.45, 0.57, 0.32);
  vec3 sandColor = vec3(0.78, 0.73, 0.53);
  vec3 mudColor = vec3(0.6, 0.5, 0.4);
  vec3 pathColor = vec3(0.82, 0.70, 0.55);
  vec3 waterColor = vec3(0.2, 0.4, 0.8);
  vec3 deepWaterColor = vec3(0.1, 0.2, 0.6);
  
  float noiseVal = fract(sin(vUv.x * 100.0 + vUv.y * 100.0) * 10000.0) * 0.05;
  float bandNoise = sin(vElevation * 8.0) * 0.02;
  
  vec3 terrainColor;
  
  if (vElevation > snowLevel) {
    terrainColor = snowColor;
  } else if (vElevation > highRockLevel) {
    float blend = (vElevation - highRockLevel) / (snowLevel - highRockLevel);
    terrainColor = mix(highRockColor, snowColor, blend);
  } else if (vElevation > midRockLevel) {
    float blend = (vElevation - midRockLevel) / (highRockLevel - midRockLevel);
    terrainColor = mix(midRockColor, highRockColor, blend);
  } else if (vElevation > lowRockLevel) {
    float blend = (vElevation - lowRockLevel) / (midRockLevel - lowRockLevel);
    terrainColor = mix(lowRockColor, midRockColor, blend);
  } else if (vElevation > grassLevel) {
    float blend = (vElevation - grassLevel) / (lowRockLevel - grassLevel);
    terrainColor = mix(grassColor, lowRockColor, blend);
  } else if (vElevation > sandLevel) {
    float blend = (vElevation - sandLevel) / (grassLevel - sandLevel);
    terrainColor = mix(sandColor, grassColor, blend);
  } else if (vElevation > waterLevel) {
    float blend = (vElevation - waterLevel) / (sandLevel - waterLevel);
    terrainColor = mix(mudColor, sandColor, blend);
    
    if (vElevation < 0.55 && vElevation > 0.45) {
      terrainColor = mix(terrainColor, pathColor, 0.7);
    }
  } else if (vElevation > deepWaterLevel) {
    float blend = (vElevation - deepWaterLevel) / (waterLevel - deepWaterLevel);
    terrainColor = mix(deepWaterColor, waterColor, blend);
  } else {
    terrainColor = deepWaterColor;
  }
  
  terrainColor += vec3(noiseVal + bandNoise);
  terrainColor = terrainColor * 1.1;
  
  float fog = 1.0 - smoothstep(0.0, 1.0, distance(vUv, vec2(0.5)));
  terrainColor = mix(terrainColor, vec3(0.85, 0.75, 0.65), (1.0 - fog) * 0.15);
  
  gl_FragColor = vec4(terrainColor, 1.0);
}
`;
