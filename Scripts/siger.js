import {PerspectiveCamera,OrthographicCamera} from "./Camera.js"
import {Vector3} from "./Vector.js"
import {Matrix} from "./Matrix.js" 
import {loadOBJ} from "./ModelLoader.js"
import {TransformMatrixes} from "./Transform.js"    
import {vsSource} from "./Shaders/VertexShader.js"
import {fsSource} from "./Shaders/FragmentShader.js"
import * as obj from "./Object3d.js"


export class SigerEngine{
    constructor(){
      this.type="SigerEngine"
      this.display=document.createElement("canvas")//rendering screen
      this.gl=this.display.getContext("webgl2")
      this.Worlds=[]
    
    }
    init(){
 
        this.shader=new SigerShaderProgram(this.gl,vsSource,fsSource)//Create shader with siger vs and fs source
        SigerGlobalManager.init(this)//Initialize global manager
        SigerGlobalManager.shaderDataManager.ubos.transformation.create(this.gl)//Create UBOS (the one which will send data to shader)
        SigerGlobalManager.shaderDataManager.ubos.materials.create(this.gl)

    }
    invokeRenderer(target=document.body,width=window.innerWidth,height=window.innerHeight){
        //Resize the renderer 
            this.display.width=width
            this.display.height=height
            this.gl.viewport(0, 0, this.display.width, this.display.height);//update the view port
        //Append it to document
            target.appendChild(this.display)
    }
    getDefaultWorld(){
        if (this.shader==undefined) 
                throw new Error("Siger Error:shader program not defined\n Make sure you initialized siger eingine by calling sigerEngine.init()")
            
        this._defaultWorld=new SigerWorld(this)// Create default world
        this._defaultWorld.Camera=new PerspectiveCamera(this.display,[0,0,-12])//create camera at default pos

        this.Worlds.push(this._defaultWorld)
        this.ActiveWorld=this._defaultWorld
        return this.ActiveWorld
    }

    
}

class SigerShaderProgram {
    constructor(gl,vs,fs) {
        this.gl =gl;
        this.type="SigerShaderProgram"
        this.vsSource=vsSource
        this.fsSource=fsSource
        this.glProgram =this.getProgramm()//the webGL shaders proggram
        this.ubo=null//Contain data of model properties

        this.getAndSetAttributeLocations()
        
    }

    loadShader(type, source) {
         //returns webGl vertext shader and fsShader
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader error: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    getProgramm(){
        const vShader = this.loadShader(this.gl.VERTEX_SHADER, this.vsSource);
        const fShader = this.loadShader(this.gl.FRAGMENT_SHADER, this.fsSource);
        const prog = this.gl.createProgram();
        SigerGlobalManager.shaderProgram =prog//create a global variable of shader program 
        //injects the vs and fs source in the shaderProgram
        this.gl.attachShader(prog, vShader);
        this.gl.attachShader(prog, fShader);
        this.gl.linkProgram(prog);
        this.gl.enable(this.gl.DEPTH_TEST)
        
        this.gl.useProgram(SigerGlobalManager.shaderProgram);//link and use the proggram
        

        
        return prog
        
    }
    getAndSetAttributeLocations(){
        this.locations = {
        attributes: {
                texcoord: this.gl.getAttribLocation(this.glProgram, 'a_texcoord'),
            },
        uniforms: {
                projection: this.gl.getUniformLocation(this.glProgram, 'uProjectionMatrix'),
                camera: this.gl.getUniformLocation(this.glProgram, 'uCameraMatrix'),
                viewWorldPosition: this.gl.getUniformLocation(this.glProgram, 'uViewWorldPosition'),
                lightDir: this.gl.getUniformLocation(this.glProgram, 'uReverseLightDir'),
                modelIndex: this.gl.getUniformLocation(this.glProgram, 'uModelIndices'),
                textureWidths: this.gl.getUniformLocation(this.glProgram, 'uAtlasDimension'),
                //Fog
                fogColor: this.gl.getUniformLocation(this.glProgram, 'u_fogColor'),
                fogNear: this.gl.getUniformLocation(this.glProgram, 'u_fogNear'),
                fogFar: this.gl.getUniformLocation(this.glProgram, 'u_fogFar')
            }
        };
    }
    
}
class ShaderDataManager {
    constructor(gl){
        this.GL=gl
        this.GlobalVbo={
            created:false,       
            freeRamMap:{},//if a model is deleted free rams data will stored here
            UnParsedModels:[],//hold models whose vbo data isnt uploaded
            vertexVbo:{
                      buffer:null,
                      bufferData:null
                  },
            vertexNormalVbo:{
                      buffer:null,
                      bufferData:null
                  },
            vertexTextureVbo:{
                      buffer:null,
                      bufferData:null
                  },
            registerFreeRAM(modelToDelete){
                this.freeRamMap[modelToDelete.Mesh._VBOindex]=modelToDelete.count
            },
            create(siger_gl,allModelPrototypes=this.UnParsedModels)
                {
                    //  Calculate total size needed
                        let totalSize = 0;
                        allModelPrototypes.forEach(m => {if (!m.isDuplicate) totalSize += m.Mesh.vertices.length;});
                        totalSize+=totalSize/this.UnParsedModels.length
                    //Create float array to store data
                        this.vertexVbo.bufferData = new Float32Array(totalSize);
                        this.vertexTextureVbo.bufferData = new Float32Array(totalSize);
                        this.vertexNormalVbo.bufferData = new Float32Array(totalSize);
                        
                        
                    
                     //Create gl buffers for each data and store data in buffer
                        this.vertexVbo.buffer = siger_gl.createBuffer();
                        
                        this.vertexTextureVbo.buffer = siger_gl.createBuffer();
                        
                        this.vertexNormalVbo.buffer = siger_gl.createBuffer();
                        
                        
                    
                    
                    // Get location to store buffer and enable the attribute
                        
                        
                        let aVertexPositionLocation = siger_gl.getAttribLocation(SigerGlobalManager.shaderProgram, 'aVertexPosition');
                        siger_gl.enableVertexAttribArray(aVertexPositionLocation);
                     
                        let aVertexNormLocation = siger_gl.getAttribLocation(SigerGlobalManager.shaderProgram, 'aVertexNorm');
                        siger_gl.enableVertexAttribArray(aVertexNormLocation);
                        
                        
                        var texcoordAttributeLocation = siger_gl.getAttribLocation(SigerGlobalManager.shaderProgram, "a_texcoord");
                        siger_gl.enableVertexAttribArray(texcoordAttributeLocation);
                        

                        
                    //bind buffer and set attributes
                        
                      
                        siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER,this.vertexVbo.buffer);
                        siger_gl.vertexAttribPointer(
                                    aVertexPositionLocation, 
                                    4,       
                                    siger_gl.FLOAT, 
                                    false, 
                                    0, 
                                    0
                        );
                        
                        
                        siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER,this.vertexNormalVbo.buffer);
                        siger_gl.vertexAttribPointer(
                             aVertexNormLocation, 
                             4, 
                             siger_gl.FLOAT, 
                             false, 
                             0, 
                             0
                        );
                               // siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER, texcoordBuffer);
                        siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER,this.vertexTextureVbo.buffer);
                        //siger_gl.enableVertexAttribArray(texcoordAttributeLocation);
                                 
                                // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
                                var tex_size = 4;          // 2 components per iteration
                                var tex_type = siger_gl.FLOAT;   // the data is 32bit floating point values
                                var tex_normalize = false;  // convert from 0-255 to 0.0-1.0
                                var tex_stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next texcoord
                                var tex_offset = 0;        // start at the beginning of the buffer
                                siger_gl.vertexAttribPointer
                                (
                                    texcoordAttributeLocation, tex_size, tex_type, tex_normalize, tex_stride, tex_offset
                                )
                                this.created=true
                                
                    },
                    
            updateData(siger_gl){ 
                        if(!this.created) this.create(siger_gl)       
                    
                        let offset = 0;
                       this.UnParsedModels.forEach((m,i) => {
                           
                            if(m.isDuplicate){
                                
                                //Since v vt vn not change during run time ,for duplicate models, just use base models v vt vn for each and every duplicate same for textures
                                m.Mesh._VBOindex=m.baseModel.Mesh._VBOindex
                                m.count = m.baseModel.count;
                                
                                 return
                                
                            }
                            this.vertexVbo.bufferData.set(m.Mesh.vertices, offset);
                            this.vertexTextureVbo.bufferData.set(m.Mesh.texCoords, offset);
                            this.vertexNormalVbo.bufferData.set(m.Mesh.normals, offset);
                            
                            m.Mesh._VBOindex= offset / 4; // Store the starting point 
                            m.count = m.Mesh.vertices.length / 4;
                            offset += m.Mesh.vertices.length;
                            m.Mesh.vertices=null
                            m.Mesh.normals=null
                            m.Mesh.texCoords=null//once uploaded to gpu v vn vt became useless ,remove them everywhere else
                           
                        });
                       siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER, this.vertexVbo.buffer);
                        siger_gl.bufferData(siger_gl.ARRAY_BUFFER, this.vertexVbo.bufferData, siger_gl.STATIC_DRAW); // Static because shapes don't change
                        siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER, this.vertexTextureVbo.buffer);
                        siger_gl.bufferData(siger_gl.ARRAY_BUFFER, this.vertexTextureVbo.bufferData, siger_gl.STATIC_DRAW); // Static because shapes don't change
                        siger_gl.bindBuffer(siger_gl.ARRAY_BUFFER, this.vertexNormalVbo.buffer);
                        siger_gl.bufferData(siger_gl.ARRAY_BUFFER, this.vertexNormalVbo.bufferData, siger_gl.STATIC_DRAW); // Static because shapes don't change

                        
                    
                        this.UnParsedModels=[]
                        return [this.vertexVbo.buffer,this.vertexNormalVbo.buffer,this.vertexTextureVbo.buffer];                    
                }

          }; //end of Global vbo
        /*-Uniform buffer arrays(materials,transformations,lighting)-*/
          this.ubos={
                   transformation:{
                       buffer:null,
                       a:0,
                       fillFor(m){
                       
                            this.buffer.bufferData.set(m.transposeMatrix.scaleMatrix, 0);
                            this.buffer.bufferData.set(m.transposeMatrix.rotationMatrix, 16);
                            this.buffer.bufferData.set(m.transposeMatrix.translateMatrix,  32);                   
                            
                       },
                       create(siger_gl){
                                let ubo = siger_gl.createBuffer();
                                const UBO_SIZE_BYTES =  48 * 4; 
                                siger_gl.bindBufferBase(siger_gl.UNIFORM_BUFFER, 0, ubo); 
                                siger_gl.bufferData(siger_gl.UNIFORM_BUFFER, UBO_SIZE_BYTES, siger_gl.DYNAMIC_DRAW);
                                const blockIndex = siger_gl.getUniformBlockIndex(SigerGlobalManager.shaderProgram, 'ModelBlock');
                                
                            //  Assign the UBO to a binding point (e.g., binding point 0)
                                siger_gl.uniformBlockBinding(SigerGlobalManager.shaderProgram, blockIndex, 0); 
                                
                            //  Create the UBO buffer object
                                const modelsDataArray = new Float32Array(UBO_SIZE_BYTES/4);
                                siger_gl.bindBuffer(siger_gl.UNIFORM_BUFFER, ubo);
                                    
                                        
                                
                                this.buffer= {
                                    buffer:ubo,
                                    bufferData:modelsDataArray
                                }                   
                       }
                   },
                   materials:{
                       buffer:null,
                      a:0,
                       fillFor(model){
                        
                             //if (this.a<6)console.log(model.Mesh)
                             this.buffer.bufferData=model.Mesh.materials.gpuData 
                             SigerGlobalManager.gl.bindBuffer(SigerGlobalManager.gl.UNIFORM_BUFFER,this.buffer.buffer)
                         
                       },
                       create(siger_gl){
                           //create the buffer
                                let ubo2 = siger_gl.createBuffer();
                            //set size    
                                const UBO_SIZE_BYTES = 20 * 24 * 4;//max 20 materials *(5vec*4 float per vector )*4 byte per fliat
                             //bind buffer at a specific address   
                                siger_gl.bindBufferBase(siger_gl.UNIFORM_BUFFER, 1, ubo2);
                                siger_gl.bufferData(siger_gl.UNIFORM_BUFFER, UBO_SIZE_BYTES, siger_gl.STATIC_DRAW);
                                const blockIndex = siger_gl.getUniformBlockIndex(SigerGlobalManager.shaderProgram, 'MaterialBlock');//get location store buffer in gpu ram
                                
                            //  Assign the UBO to a binding point (e.g., binding point 0)
                                siger_gl.uniformBlockBinding(SigerGlobalManager.shaderProgram, blockIndex, 1);
                                
                                
                                
                                let materialsDataArray = new Float32Array(UBO_SIZE_BYTES / 4);
                                
                                
                                
                                
                                this.buffer= {
                                    buffer: ubo2,
                                    bufferData: materialsDataArray
                                }                   
                       },//end of materials.ubo
                   }//end of shader.materials
                   
        }//end of this.shaders
    /*-texture manger-*/
         this.textureUnit={
            
                    GL:SigerGlobalManager.gl,
                    diffuseTexture:{
                        GL:SigerGlobalManager.gl,
                        textureMap:{
                            Siger_Default_Diffuse_Texture:[0,0,1,1]
                        },
                        //glLocation:this.gl.getUniformLocation(this.glProgram, 'uDiffuseTexture'),
                        img:null,
                        size:[1,1],
                        buffer:0,
                        canvas:null,
                        ctx:null,
                        bindTexture(){
                                
                                       // const imageData = this.ctx.getImageData(0, 0, this.canvas.width,this.canvas.height).data;
                                        //const buffer = new Uint8Array(imageData);
                                        
                                        var texture = gl.createTexture();
                                        gl.bindTexture(gl.TEXTURE_2D, texture);
                                     
                                        // Set the parameters so we don't need mips
                                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                                       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                                       
                                        // Upload the image into the texture.
                                        const mipLevel = 0;               // the largest mip
                                        const internalFormat = gl.RGBA;   // format we want in the texture
                                        const srcFormat = gl.RGBA;        // format of data we are supplying
                                        const srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
                                        gl.texImage2D(gl.TEXTURE_2D,
                                                      mipLevel,
                                                      internalFormat,
                                                      srcFormat,
                                                      srcType,
                                                    this.canvas );
                                        //document.appendChild(this.canvas)
                                        //this.glTexture=texture
                                        // gl.generateMipmap(gl.TEXTURE_2D)
                                        gl.activeTexture(gl.TEXTURE0);
                                        gl.bindTexture(gl.TEXTURE_2D, texture);
                    
                                                      
                                },//end of diffuseTexture.bindTexture
                                          
                        addTexture(texture){
                                if(this.textureMap[texture.textureId]) return this.textureMap[texture.textureId]
                               
                                const ox=this.canvas.width//pos where new texture start
                            //create a temp canvas to copy current data as resizing canvas will wipe out data
                                const tempCanvas = new OffscreenCanvas(this.canvas.width,this.canvas.height)
                               
                                const tempCtx = tempCanvas.getContext('2d');
                                
                                
                                tempCtx.drawImage(this.canvas, 0, 0);
                            // check if image is large
                                if(texture.textureDimension[2]>512||texture.textureDimension[3]>512)
                                    texture.textureDimension=[0,0,512,512]


                            //resize the canvas
                                this.canvas.width+=texture.textureDimension[2]
                                this.canvas.height=Math.max(this.canvas.height,texture.textureDimension[3])
                                    
                                this.GL.uniform4fv(SigerGlobalManager.shader.locations.uniforms.textureWidths, [this.canvas.width, this.canvas.height, 0, 0]);
                            //Paste copied data
                                this.ctx.drawImage(tempCanvas, 0, 0);
                            //push new texture to cluster
                                
                                
                                this.ctx.drawImage(texture.img,ox,0,texture.textureDimension[2],texture.textureDimension[3]);
                               
                                this.bindTexture()
                                this.textureMap[texture.textureId]=[ox,1,texture.textureDimension[2],texture.textureDimension[3]]
                               
                                return this.textureMap[texture.textureId]
                        }
                    
                        
                    },//end of diffuseTexture 
                    init(){
                        //const img=new OffscreenCanvas(1,1)
                   
                        this.diffuseTexture.canvas=new OffscreenCanvas(1,1)
                        

                        this.diffuseTexture.ctx=this.diffuseTexture.canvas.getContext("2d")
                        this.diffuseTexture.ctx.fillStyle="#fffffff"
                        this.diffuseTexture.ctx.fillRect(0,0,1,1)
                        this.diffuseTexture.Gl_Location = this.GL.getUniformLocation(SigerGlobalManager.shaderProgram, "uDiffuseTexture");
                        this.GL.uniform4fv(SigerGlobalManager.shader.locations.uniforms.textureWidths, [1,1, 0, 0]);
                        //var u_image1Location = gl.getUniformLocation(program, "u_image1");
                        
                        // set which texture units to render with.
                        this.GL.uniform1i(this.diffuseTexture.GL_Location, 0); // texture unit 0
                        this.GL.activeTexture(this.GL.TEXTURE0);
                        this.diffuseTexture.bindTexture()
                        
                            
                    },
                 
                }//end of textureUnit
          
    }
}
export const SigerGlobalManager={
    
        gl:null,
        engine:null,
        shader:null,
        worlds:[],
        PhysicsEngine:null,
        init(engine){
                this.gl=engine.gl
                this.engine=engine
                this.shader=engine.shader 
                this.shaderProgram=engine.shader.glProgram
                this.shaderDataManager=new ShaderDataManager(this.gl)
                this.shaderDataManager.textureUnit.init()
                
        
        }
        
    
}


//Every thing which is visible or whose presence can be felt (like camera ,light and fog) resides in Siger world and we call them worldEntity
export class SigerWorld{
  /**
    * @param {WebGLRenderingContext} gl - The WebGL rendering context.
    * @param {SigerShaderProgram} shader - The shader program used for rendering.
    * @param {SigerEngine} engine - The SigerEngine instance.
    */
    constructor(engine)
    {
        this.type="SigerWorld"
        this.gl=engine.gl
        this.Camera=null
        this.engine=engine
        this.info={
            Camera:this.Camera,

            
        }
        this.shader=engine.shader
        this.render=renderWorld
        this.renderings=new SigerWorldRenderings(this,this.shader,this.engine)
        this.effects=new SigerWorldEffects(this.gl,this.shader)
        SigerGlobalManager.worlds.push(this)
    }
    add(entity){
        let ObjectAdders={
            Object3D:this.renderings._addMeshObject,
            VehicleBody3D:this.renderings._addMeshObject,
            SGM:this.renderings._addSimpleGridMap,
            Fog:this.effects.setFog.bind(this.effects)
        }
        if (!ObjectAdders[entity.type]) throw new Error(`Siger Error: Cannot add entity of type ${entity.type}. No method defined for this type.`)
        return ObjectAdders[entity.type](entity,this)

    }
    
}


//Every object of siger world which can rendered or is visible resides in siger world rendring

class SigerWorldRenderings{
    constructor(world,shader,engine){
        this.type="SigerWorldRendering"
        this.world=world
        this.info={
             objectCount:0,
             verticesCounts:0,
             polygonCounts:0,
             groupCounts:0,
             materials:{
                 count:0,
                 data:[]
             }
            }   
        this.shader=shader
        this.normalModels=[]//all objs
        this.skinnedModels=[]//all glb models having joints and animations
    }
    _addMeshObject(object,world){        
        object.updateTransformation()        
        let Entity=obj.WorldEntity(object,world)
        world.renderings.normalModels.push(Entity)//add the model to world:)
        let dim=Entity.dimension.size
        let scale=Entity.scale
        Entity.dimension.renderedSize= new Vector3([dim.x*scale.x,dim.y*scale.y,dim.z*scale.z])
   
        let halfW = Entity.dimension.renderedSize.x / 2;
        let halfH = Entity.dimension.renderedSize.y / 2;
        let halfD = Entity.dimension.renderedSize.z / 2;

// The maximum distance from the center to any corner vertex
        Entity.boundingRadius = Math.sqrt(halfW * halfW + halfH * halfH + halfD * halfD);
        SigerGlobalManager.shaderDataManager.GlobalVbo.UnParsedModels.push(Entity)          
        return Entity

    }
    _addSimpleGridMap(map,world){
        function registerColliderInGrid(map, box) {
            let cellSize = map.cellSize;

            let minCellX = Math.round(box.min.x / cellSize);
            let maxCellX = Math.round(box.max.x / cellSize);
            let minCellZ = Math.round(box.min.z / cellSize);
            let maxCellZ = Math.round(box.max.z / cellSize);

            for (let z = minCellZ; z <= maxCellZ; z++) {
                for (let x = minCellX; x <= maxCellX; x++) {
                    if (!map.colliderGrid[z]) map.colliderGrid[z] = [];
                    if (!map.colliderGrid[z][x]) map.colliderGrid[z][x] = [];

                    // Push the lightweight bounding box reference directly into the cell
                    map.colliderGrid[z][x].push(box);
                }
            }
        }
        map.world=world
        
        map.mapObjects.forEach((o,i)=>{
            if(o.isBase) o.index=map.world.renderings.normalModels.length
            o=map.parseEntity(o,o.cell,o.scale.copy(),o.isDuplicate)
            let entity=map.world.add(o)
            o=entity
        //make mapData point to the worldEntity object
            let posI=entity.unitPosition[0]
            let posJ=entity.unitPosition[1]

            let sizeI=entity.cellsCovered[0]
            let sizeJ=entity.cellsCovered[1]
          
            for(let i=posI;i<posI+sizeI;i++){ // loop through all the cells entity covers
                for(let j=posJ;j<posJ+sizeJ;j++){
                    
                //Overflow detection
                    if(j>=map.mapData.length){
                       throw new Error(`Siger Error: Map overflow at row ${j}. The object ${entity.name} at cell [${posI},${posJ}] with size [${sizeI},${sizeJ}] exceeds the map's defined rows (${map.rows}). Please check the map dimensions or the object's placement.`)
                    }
                    map.mapData[j][i]=[entity.index]// store the index of the worldEntity in the mapData array
                    map.mapObjects[entity.indexMap]=entity
                    if(entity.BoundingBox)
                        registerColliderInGrid(map, entity.BoundingBox)//store the bounding box in the colliderGrid for collision detection
                }
            }
            if(entity.isDuplicate)entity.baseModel=map.world.renderings.normalModels[o.baseModel.index]
            
            
        })
       
        
        


    }

    
}

function renderWorld() {
            this.Camera.control()
            // const uMatrixLocation = siger_gl.getUniformLocation(SigerGlobalManager.shaderProgram, 'uRotationMatrix');


            if(SigerGlobalManager.shaderDataManager.GlobalVbo.UnParsedModels.length>0)SigerGlobalManager.shaderDataManager.GlobalVbo.updateData(this.gl)                                                               
            const primitiveType = this.gl.TRIANGLES                                                            
            //this.gl.useProgram(SigerGlobalManager.shaderProgram);
        //  Send the Projection Matrix ,camera matrix and other uniforms
             this.gl.uniformMatrix4fv(this.shader.locations.uniforms.projection, false,this.Camera.projectionMatrix());
             this.gl.uniformMatrix4fv(this.shader.locations.uniforms.camera, false,this.Camera._GlMatrix)
             this.gl.uniform3fv(this.shader.locations.uniforms.viewWorldPosition, [this.Camera.position.x,this.Camera.position.y,this.Camera.position.z]);
             this.gl.uniform4fv(this.shader.locations.uniforms.lightDir, [0.0, 1.0, 0.5, 0.0]);
   
             //const vertexCount = vertices.length / 4;

             const camera=this.Camera
             
            this.gl.clearColor(0x00/255, 0x00/255, 0x000/255, 0.0); 
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            
            
            this.renderings.normalModels.forEach((m, i) => 
            {
        //get distance of object from camera

                
                           let dx = camera.position.x - m.position.x;
            let dy = camera.position.y - m.position.y;
            let dz = camera.position.z - m.position.z;
            let distanceSquared = dx * dx + dy * dy + dz * dz;

            let maxRenderDistance = 600;

            // Expand the max distance by the object's own bounding radius!
            let effectiveMaxDist = maxRenderDistance + (m.boundingRadius || 0);
            let maxRenderDistSq = effectiveMaxDist * effectiveMaxDist;

            if (distanceSquared > maxRenderDistSq) {
                return; // Safe to skip: even the closest edge of this giant object is out of range
            }


                if (m.update)m.update()
            //fill floatArray     
                SigerGlobalManager.shaderDataManager.ubos.transformation.fillFor(m)
                SigerGlobalManager.shaderDataManager.ubos.materials.fillFor(m)
            //upload floatArray to buffer
                this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, SigerGlobalManager.shaderDataManager.ubos.transformation.buffer.buffer);
                this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, SigerGlobalManager.shaderDataManager.ubos.transformation.buffer.bufferData);
                
                this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, SigerGlobalManager.shaderDataManager.ubos.materials.buffer.buffer);
                this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, SigerGlobalManager.shaderDataManager.ubos.materials.buffer.bufferData);                  
                this.gl.uniform1i(SigerGlobalManager.shader.locations.uniforms.modelIndex, i);

                this.gl.drawArrays(primitiveType, m.Mesh._VBOindex, m.count);
            });       

    
}//end of renderWorld function 
class SigerWorldEffects{
    constructor(gl,shader){
        this.fog=""
        this.shader=shader
        this.gl=gl
        this.ambientLight=""
        this.directionalLight=""
        this.spotLight=""
    }
    setFog(fog){
        this.fog=fog
        this.gl.uniform4fv(this.shader.locations.uniforms.fogColor, this.fog.color);
        this.gl.uniform1i(this.shader.locations.uniforms.fogNear, this.fog.near);
        this.gl.uniform1i(this.shader.locations.uniforms.fogFar, this.fog.far);
    }
    setAmbientLight(light){
        this.ambientLight=light
    }
}
export class Fog{
    // adds fog to webgl scene
    constructor(color,near,far){
        this.type="Fog"
        this.color=color
        this.near=near
        this.far=far
    }
}
//=========================================================================

export class SimpleGridMap{
    /**
    
    * @param {number} rows - The number of rows in the grid.
    * @param {number} columns - The number of columns in the grid.
    * @param {number} cellSize - The size of each cell in the grid.
    * @param {Object} attributes - Optional attributes for customization.
*/
    constructor(rows,columns,cellSize,attributes){
        if(!attributes) attributes={
            autoScale:true,
            padding:0,
            plane:"xz"
        }
        this.rows=rows
        this.columns=columns
        this.type="SGM"
        this.cellSize=cellSize
        this.mapData=[]//each entery points to index of object in world.renderings.normalModels array which intersect that cell
        this.mapObjects=[]
        this.colliderGrid=[]// each entery points to an array of bounding boxes of objects which intersect that cell
        this.colliders=[]//store all bounding boxes of objects in the map
        this.plane="xz"
        this.fillWithZeros()

    }
    fillWithZeros(){

        let row=[]
        for(let i=0;i<=this.rows;i++){
                row.push(0)
        }
        for (let i=0;i<=this.columns;i++){
                this.mapData.push([...row])
                this.colliderGrid.push([...row])
        }
    }
    /**
        * Adds an object to the grid map.
        * @param {Object3D} object - The object to be added.
        * @param {Array<Number>} Cell - The cell coordinates [x, y] where the object will be placed.
        * @param {Vector3} scale - The scale of the object in terms of grid cells.
        * @param {boolean} boundingBox - Whether to create a bounding box for the object (default: true).
    */
    addObject(object,Cell,scale,boundingBox=true){
        object.scale=scale.copy()
        object.colliders="_WholeMesh"

        object=new obj.MapEntity(object,this)//convert to MapEntity(can be duplicated or deleted)
        let i=this.mapObjects.push(object) // store the object in mapObjects array            
        object=this.mapObjects[i-1]
        object.cell=Cell
     
        return object
    }
    parseEntity(object,Cell,scale){
    // Set the position  based on the cell coordinates and cell size
        object.position[this.plane[0]]=Cell[0]*this.cellSize
        object.position[this.plane[1]]=Cell[1]*this.cellSize
    //Scale to cell size
        object.scale[this.plane[0]]=(this.cellSize/object.dimension.size[this.plane[0]])*scale[this.plane[0]]
        object.scale[this.plane[1]]=this.cellSize/object.dimension.size[this.plane[1]]*scale[this.plane[1]]
     //store how many cell object cover
        let sizeInt=[Math.round(scale[this.plane[0]]),Math.round(scale[this.plane[1]])]
        object.cellsCovered=[sizeInt[0],sizeInt[1]]
        object.unitPosition=[parseInt(Cell[0]),parseInt(Cell[1])]
    //swap cellsCovered if rotation is at multiple of 90 deg
        let deg=parseInt(object.rotation.y*180/Math.PI)
        if ((deg*180/Math.PI)%90!=0 && deg!=0 && (deg*180/Math.PI%180)!=0)object.cellsCovered=[sizeInt[1],sizeInt[0]]
    // Bind the object with a bounding box for collision detection
        object.BoundingBox=null
        if(object.colliders=="_WholeMesh")object.BoundingBox=obj.BoundingBox.bindObject3d(object)
        else if(object.colliders)object.BoundingBox=obj.BoundingBox.bindSubMesh(object,object.Mesh.groups[object.colliders])
        return object
    }

}

