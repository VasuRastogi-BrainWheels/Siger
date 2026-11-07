 export const fsSource = `#version 300 es
precision highp float;
//Material
struct MaterialData {
 vec4 diffuse;
 vec4 ambient;
 vec4 specular;
 vec4 emissive;
 vec4 diffuseMapDimensions;
};

in MaterialData currentMaterial;
in float fogDepth;
uniform sampler2D diffuseMap;
uniform vec4 uAtlasDimension;
//Verticies
in vec4 v_normal;
in vec2 v_texcoord;
//Fog
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;
//Lights
uniform vec4 uReverseLightDir;


out vec4 outColor;

void main() {
 //float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDepth);
 vec4 normal = normalize(v_normal);
 // compute the light by taking the dot product
 // of the normal to the light's reverse direction
 float light = max(dot(normal, normalize(uReverseLightDir)), 0.0);
 float totalLight = light+0.5 ;
 
 vec4 diffuseMapColor  =texture(diffuseMap, vec2((v_texcoord.x*currentMaterial.diffuseMapDimensions.z+currentMaterial.diffuseMapDimensions.x)/uAtlasDimension[0],(1.0-v_texcoord[1])*currentMaterial.diffuseMapDimensions.w/uAtlasDimension[1]));    
 //  
   vec3 effectiveDiffuse = mix(currentMaterial.diffuse.rgb, diffuseMapColor.rgb, currentMaterial.diffuseMapDimensions.y);
 
   float fakeLight = dot(normalize(uReverseLightDir), normal )* .5 + .5;
    outColor=vec4(vec3(currentMaterial.emissive.rgb)+vec3(currentMaterial.ambient.rgb)*vec3(0.001,0.001,0.001)+vec3(effectiveDiffuse)*totalLight,1.0);
    outColor=vec4(effectiveDiffuse,1.0);
    //outColor.rgb *= totalLight;
    //outColor = mix(outColor, u_fogColor, 0.3);//mix the fog in main color
    

  
  
}
`;  