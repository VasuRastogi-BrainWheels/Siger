
export const vsSource = `#version 300 es       
    precision highp float; // Required for floating-point calculations
    struct ModelData {
        mat4 scaleMatrix;
        mat4 rotationMatrix;
        mat4 translateMatrix;
        
    };
    struct MaterialData {
        vec4 diffuse;
        vec4 ambient;
        vec4 specular;
        vec4 emissive;
        vec4 diffuseMapDimensions;
    };

    // 2. Define the Uniform Buffer Object (UBO) Block
    // This block contains an array of the structures.
    // We assume a maximum of 100 models (MAX_MODELS).
    #define MAX_MODELS_Parts 1
    layout(std140) uniform ModelBlock {
        ModelData models[MAX_MODELS_Parts];
    };
    layout(std140) uniform MaterialBlock {
        MaterialData materials[15];
    };
    // --- Inputs (Attributes/Uniforms) ---
    in vec4 aVertexPosition; // Vertices come in as an 'input'
    in vec4 aVertexNorm;
    in vec4 a_texcoord;
    out MaterialData currentMaterial;
    out vec4 v_normal;
    out vec2 v_texcoord;
    out float fogDepth;
    out vec3 v_surfaceToView;
    uniform vec4 uModelIndices;
    
    uniform mat4 uProjectionMatrix; 
    uniform mat4 uCameraMatrix;   
    uniform vec3 uViewWorldPosition; // <-- The world position of the camera
    uniform int uModelIndex; // <-- The INT index to select the model
    
     
    void main() {

    
        int a=int(a_texcoord.z);
        ModelData currentModel = models[0];
        


        vec4 worldPosition =  currentModel.translateMatrix*currentModel.rotationMatrix* currentModel.scaleMatrix*aVertexPosition;       
        v_surfaceToView = uViewWorldPosition - worldPosition.xyz;
        
        gl_Position = uProjectionMatrix *uCameraMatrix *worldPosition;
        

            
 
        v_texcoord =vec2(a_texcoord.x,a_texcoord.y);
        
        currentMaterial=materials[a];
        vec4 viewPosition = uCameraMatrix * worldPosition;

// Distance in front of camera is along the -Z axis, so negate it for positive depth:
fogDepth = -viewPosition.z;
// Multiplying by a mat3 only uses the rotation part, ignoring translation/pos
v_normal = vec4(mat3(currentModel.rotationMatrix) * aVertexNorm.xyz, 0.0);
            
        
    }

        
        
    
    
`;  
