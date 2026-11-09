 export const fsSource = `#version 300 es
precision highp float;
//Material
struct MaterialData {
 vec4 diffuse;
 vec4 ambient;
 vec4 specular;
 vec4 emissive;
 
 vec4 diffuseMapDimensions;
 vec4 properties;
};

in MaterialData currentMaterial;
in float fogDepth;
uniform sampler2D diffuseMap;
uniform vec4 uAtlasDimension;
//inputs
in vec4 v_normal;
in vec2 v_texcoord;
in vec3 v_surfaceToView;
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

//Lightining
    float light = max(dot(normal, uReverseLightDir), 0.0);
    float totalLight = light+0.5 ;
    float fakeLight = dot(uReverseLightDir, normal )* .5 + .5;
//Diffussion and texture  
    vec4 diffuseMapColor  =texture(diffuseMap, vec2((v_texcoord.x*currentMaterial.diffuseMapDimensions.z+currentMaterial.diffuseMapDimensions.x)/uAtlasDimension[0],(1.0-v_texcoord[1])*currentMaterial.diffuseMapDimensions.w/uAtlasDimension[1]));    
  
    vec3 effectiveDiffuse = mix(currentMaterial.diffuse.rgb, diffuseMapColor.rgb, currentMaterial.properties.z);
 
    
    outColor=vec4(
      currentMaterial.emissive.rgb+
      currentMaterial.ambient.rgb*vec3(0.001,0.001,0.001)+  
      effectiveDiffuse*totalLight
       ,currentMaterial.properties.y);

    outColor.rgb *= totalLight;
    //outColor = mix(outColor, u_fogColor, 0.3);//mix the fog in main color
    

  
  
}
`;  