import {loadOBJ} from "./ModelLoader.js"
import {PerspectiveCamera} from "./Camera.js"
import {SigerGlobalManager} from "./siger.js"
import {Matrix} from "./Matrix.js"
import {Vector3} from "./Vector.js"
import {TransformMatrixes,rotate_x,rotate_y,rotate_z,Translate,Scale} from "./Transform.js" 

function duplicateObject(obj,transformation){
    let dimension=obj.dimension
    
    return {...obj,...{
        type:obj.type,
        Mesh:{
            _VBOindex:0,
            activeGroups:{},
            groups:obj.Mesh.groups,
            vertices:obj.Mesh.polygons,
            normals:obj.Mesh.normalPolygon,
            texCoords:obj.Mesh.texturePolygon,
            materials:obj.Mesh.materials,

        },
        position:transformation.position??obj.position.copy(),
        scale:transformation.scale??obj.scale.copy(),
        rotation:transformation.rotation??obj.rotation.copy(),
        isDuplicate:true,
        isBase:false,
        materials:obj.materials,

        baseModel:obj,
        transposeMatrix:{//gpu matricies

            scaleMatrix: null,
            translateMatrix: null,
            rotationMatrix:null,
            previousPos:new Vector3([-1,-1,-1]),
            previousRotation:new Vector3([-1,-1,-1]),
            previousScale:new Vector3([-1,-1,-1]),
        },
        dimension:{
            size:dimension.size.copy(),
            min:new Vector3([dimension.min.x,dimension.min.y,dimension.min.z]),
            max:new Vector3([dimension.max.x,dimension.max.y,dimension.max.z]),
            center:dimension.center.copy(),
            update(){
                const min=this.dimension.min.copy()
                const max=this.dimension.max.copy()
                let vertices=new Matrix([
                    [min.x,min.y,min.z,1],
                    [max.x,max.y,max.z,1],
                ])
                let transformation = Scale(this.scale);       
                transformation = transformation.multiply(rotate_y(this.rotation.y));
                transformation = transformation.multiply(Translate(this.position));
               
                vertices = vertices.multiply(transformation);

                return{
                    min:new Vector3([vertices.data[0][0],vertices.data[0][1],vertices.data[0][2]]),
                    max:new Vector3([vertices.data[1][0],vertices.data[1][1],vertices.data[1][2]]),
                }
            }
        }

    }}
}
/**
 * @param {string} path - Path to mesh
 * @param {Object} transformation - transformation vectors
 * @param {Vector3} transformation.position - The position vector
 * @param {Vector3} transformation.rotation - The rotation vector
 * @param {Vector3} transformation.scale - The scale vector
 * @return {Object} Object- an object3d which can be added to world and can convert to dynamic bodies
 */
export async function Object3D(path ,transformation={}) {
    
    let Model=await loadOBJ(path)
   let data= {
                type:"Object3D",

                Mesh:{
                    _VBOindex:0,
                    activeGroups:[],
                    groups:Model.groups,
                    vertices:Model.polygons,
                    normals:Model.normalPolygon,
                    texCoords:Model.texturePolygon,
                    materials:Model.Materials,
                },
                position:transformation.position??new Vector3([0,0,0]),
                 rotation:transformation.rotation??new Vector3([0,0,0]),
                scale:transformation.scale??new Vector3([1,1,1]),
                isDuplicate:false,
                startOffset:0,
                is_static:false,
                count:0,
                dimension:{
                    min:Model.dimension.min.copy(),
                    max:Model.dimension.max.copy(),
                    size:Model.dimension.size.copy(),
                    center:Model.dimension.center,
                    update(){
                        const min=this.dimension.min
                        const max=this.dimension.max
                        let vertices=new Matrix([
                            [min.x,min.y,min.z,1],
                            [max.x,max.y,max.z,1],
                        ])
                        let transformation = Scale(this.scale);       
                        transformation = transformation.multiply(rotate_y(this.rotation.y));
                        transformation = transformation.multiply(Translate(this.position));
                        //vertices=vertices.multiply(Translate(this.dimension.center))
                        vertices = vertices.multiply(transformation);

                        return{
       min:new Vector3([vertices.data[0][0],vertices.data[0][1],vertices.data[0][2]]),
                    max:new Vector3([vertices.data[1][0],vertices.data[1][1],vertices.data[1][2]]),
                        }
                    }
                },
                transformationType:"dyn",//static:model dont rotate or scale(like trees buildings) dyn:model can rotate
                transposeMatrix:{//gpu matricies

                     scaleMatrix: null,
                     translateMatrix: null,
                     rotationMatrix:null,
                     previousPos:new Vector3([-1,-1,-1]),
                     previousRotation:new Vector3([-1,-1,-1]),
                     previousScale:new Vector3([-1,-1,-1]),
               },
               setScale(scale){

                   this.transposeMatrix.scaleMatrix=TransformMatrixes.getScaleMatrix(scale )
               },
               translate(pos){
                   this.position=pos
                   this.transposeMatrix.translateMatrix=TransformMatrixes.getTranslateMatrix(pos.x,pos.y,pos.z)

               },
               rotate_x(angle){
                    this.rotation.x=angle
                    this.transposeMatrix.previousRotation.x=angle
                   this.transposeMatrix.rotationMatrix=rotate_x(angle)
               },
               rotate_y(angle){
                    this.rotation.y=angle
                    this.transposeMatrix.previousRotation.y=angle
                    if(! this.transposeMatrix.rotationMatrix) this.transposeMatrix.rotationMatrix=rotate_y(angle)
                    else this.transposeMatrix.rotationMatrix=this.transposeMatrix.rotationMatrix.multiply(rotate_y(angle))
               },
               rotate_z(angle){
                   this.rotation.z=angle
                   this.transposeMatrix.previousRotation.z=angle
                   if(!this.transposeMatrix.rotationMatrix) this.transposeMatrix.rotationMatrix=rotate_z(angle)
                   else this.transposeMatrix.rotationMatrix=this.transposeMatrix.rotationMatrix.multiply(rotate_z(angle))
               },


               updateTransformation(){
                   if(!this.rotation.equalTo(this.transposeMatrix.previousRotation))this.transposeMatrix.rotationMatrix=null
                   if(!this.scale.equalTo(this.transposeMatrix.previousScale))this.setScale(this.scale)
                   if(this.rotation.x!=this.transposeMatrix.previousRotation.x)this.rotate_x(this.rotation.x)
                   if(this.rotation.y!=this.transposeMatrix.previousRotation.y) this.rotate_y(this.rotation.y)
                   if(this.rotation.z!=this.transposeMatrix.previousRotation.z) this.rotate_z(this.rotation.z)
                   if(this.transposeMatrix.rotationMatrix.type=="SigerMatrix")this.transposeMatrix.rotationMatrix=this.transposeMatrix.rotationMatrix.getFloat32Array()
                   if(!this.position.equalTo(this.transposeMatrix.previousPos))this.translate(this.position)
                    this.transposeMatrix.previousRotation=this.rotation.copy()
                    this.transposeMatrix.previousPos=this.position.copy()
                    this.transposeMatrix.previousScale=this.scale.copy()
                   
               },
           }

            Object.keys(Model.Materials.map).forEach((m,i)=>{
                m=Model.Materials.map[m]
                data.Mesh.materials.gpuData.set( [m.diffuse[0],m.diffuse[1],m.diffuse[2],1], i*24+0);
                data.Mesh.materials.gpuData.set( [m.ambient[0],m.ambient[1],m.ambient[2],1], i*24+4);
                data.Mesh.materials.gpuData.set( [m.specular[0],m.specular[1],m.specular[2],1], i*24+8);
                data.Mesh.materials.gpuData.set( [m.emissive[0],m.emissive[1],m.emissive[2],1], i*24+12);
                
                m.diffuse.textureDimension=SigerGlobalManager.shaderDataManager.textureUnit.diffuseTexture.addTexture(m.textures.diffuse)
                data.Mesh.materials.gpuData.set(SigerGlobalManager.shaderDataManager.textureUnit.diffuseTexture.addTexture(m.textures.diffuse), i*24+16);

                data.Mesh.materials.gpuData.set( [m.shininess,m.opacity,m.hasTexture,1], i*24+20);});
                

    return data
}
/**
    *@param {Object3D} obj3d
    *@params {maxSpeed,power,breakForce} physical properties of the vehicle
    *@@return {VehicleBody3D} a vehicle body with physics properties
*/
export function VehicleBody3D(obj3d,physicalProperties={}){
    return {...obj3d,...
        {
          type:"VehicleBody3D",

          speed:0,
          acceleration:0,
          velocity:new Vector3([0,0,0]),
          friction:0.03,//friction coefficient
          steeringAngle:0,// current steering angle of the vehicle
          jolt :0,//amount by which acceleration will change
          BoundingBox:BoundingBox.bindObject3d(obj3d,new Vector3([0.0,0.0,0.0])),   
          direction:0,
          maxSpeed:physicalProperties.maxSpeed??6,
          power:physicalProperties.power??0.05,
          breakForce:physicalProperties.breakForce??0.05,

          steering:{
                angle:0,
                deltaAngle:0
          },
          checkMapCollison(projectedPosition) {
                if(!this.speed)return
                let originalPos = this.position.copy();//store orignal position

                // ====================  CHECK Z AXIS ====================
                this.position = new Vector3([originalPos.x, originalPos.y, projectedPosition.z]);//move vehicle along z axis
                this.BoundingBox.updateTransformation(this);
                this.position = originalPos; // restore

                if (this.checkCollisionAgainstCells(this.BoundingBox)) {
                    this.velocity.z = 0;
                    
                    //this.position.z -= Math.sin(90*Math.PI/180+this.steering.angle)*1.5; // restore z position  
                    this.speed = 0;
                }

                // ==================== CHECK X AXIS ====================
                this.position = new Vector3([projectedPosition.x, originalPos.y, originalPos.z]);
                this.BoundingBox.updateTransformation(this);
                this.position = originalPos; // restore

                if (this.checkCollisionAgainstCells(this.BoundingBox)) {
                    this.velocity.x = 0;
            //      console.log("BoomHit X")    
                    //this.position.x += Math.cos(90*Math.PI/180+this.steering.angle)*1.5; // restore x position
                    this.speed = 0;
                }
            },

            // Helper method to check all grid cells touched by the BoundingBox
          checkCollisionAgainstCells(box) {
                let cellSize = this.map.cellSize;

                // Find the min and max grid cells covered by the bounding box extents
                let minCellX = Math.round(box.min.x / cellSize);
                let maxCellX = Math.round(box.max.x / cellSize);
                let minCellZ = Math.round(box.min.z / cellSize);
                let maxCellZ = Math.round(box.max.z / cellSize);
                if(this.speed<-1) maxCellZ=minCellZ
                else  minCellZ=maxCellZ
            // Loop through every grid cell the vehicles box covers
                for (let z = minCellZ; z <= maxCellZ; z++) {
                    for (let x = minCellX; x <= maxCellX; x++) {
                        let colliders = this.map.colliderGrid[z]?.[x];//check if object collider list  is present
                        if (!colliders) continue;
                        

                        for(let col=0;col<colliders.length;col++){
                            let objectCollider =colliders[col];// get the collider
                            
                            
                            if (objectCollider.intersects(box)) return true; // Collision found
                            
                        }
                    }//x loop ends
                }//z loop ends
                return false;
            },         
        update(){
            //Calculate speed & acceleration based on jolt and direction

              this.acceleration=this.direction*this.jolt//increase acceleration by power in direction of movment
              this.speed+=this.acceleration//increase base speed
              if(!this.direction)this.speed*=1-this.friction//apply friction
        //Clamp speed
              if(!this.direction && Math.abs(Math.round(this.speed))==0) this.speed=0
              if(this.speed>this.maxSpeed) this.speed=this.maxSpeed
              else if (this.speed<-this.maxSpeed) this.speed=-this.maxSpeed
              
        //calculate velocity vector in xz plane using speed and steering angle
              this.velocity.x=-Math.cos(90*Math.PI/180+this.steering.angle)*this.speed
              this.velocity.z=Math.sin(90*Math.PI/180+this.steering.angle)*this.speed
              let projectedPosition=this.position.plus(this.velocity)
              this.checkMapCollison(projectedPosition)
        //Change position with respect to velocity
              this.position.add(this.velocity)

        //steering
                this.steering.angle+=this.steering.deltaAngle
                
                this.rotation.y=this.steering.angle
        //Update cars transformation
                this.updateTransformation()
          },
          useMap(map){
                this.map=map
                this.mapPlane=map.plane
                this.cell=[0,0]
          },
          forwardGear(){
          	this.direction = 1
			this.jolt = this.power
          },
          backGear(){
          	this.direction = -1
			this.jolt = this.breakForce
          }, 
          steerRight(){
               if(this.speed)this.steering.deltaAngle=0.02
          },
          steerStop(){
            this.steering.deltaAngle=0
        },
          steerLeft(){
              if(this.speed)this.steering.deltaAngle=-0.02
          },
          invokeFPSControll(){
            var body=this
            
            document.addEventListener("keydown", function(event) {

                 if (event.code === "KeyW") {
                    
                    body.direction=1
                    body.jolt=body.power
                 }
                 else if (event.code === "KeyS") {
                    
                    body.direction=-1
                    body.jolt=body.breakForce
                 }
                 if (event.code === "ArrowLeft") {
                   if(body.speed)body.steering.deltaAngle=-0.02
                    
                 }
                 else if (event.code === "ArrowRight") {
                    
                     if(body.speed)body.steering.deltaAngle=0.02
                 }
                


                 
                

            })
            document.addEventListener("keyup", function(event) {
                 if (event.code === "KeyW"||event.code === "KeyS") {

                        body.direction=0
                 }
                 if (event.code === "ArrowLeft"||event.code === "ArrowRight") {

                        body.steering.deltaAngle=0
                       
                 }


            })

        }//end of invokeFPS
    }}//end of rigidBody object

    
    
}
export class BoundingBox{
    constructor(obj,padding=new Vector3([0,0,0])){
        let scale=obj.scale
        let dim=new Vector3([(obj.dimension.size.x*scale.x)-padding.x,(obj.dimension.size.y*scale.y)-padding.y,(obj.dimension.size.z*scale.z)-padding.z])
        this.dimension=dim
        this.position=obj.position.copy()
        this.rotation=obj.rotation.copy()
        this.scale=obj.scale
        //this.cube=SigerGlobalManager.worlds[0].renderings.normalModels[0].duplicate()
        this.center=obj.center?obj.center: obj.dimension.center
        if(! this.center) this.center=new Vector3([0,0,0])
           
        //this.center=new Matrix([[this.center.x,this.center.y,this.center.z,1]])
        this.BindingObject=obj
        this.min=obj.dimension.min

        this.max=obj.dimension.max
        this.vertices=new Matrix([
             [0.5, 0.5, -0.5,1],
             [0.5, -0.5, -0.5,1],
             [0.5, 0.5, 0.5,1],//max
             [0.5, -0.5, 0.5,1],
             [-0.5, 0.5, -0.5,1],
             [-0.5, -0.5, -0.5,1],//min
             [-0.5, 0.5, 0.5,1],
             [-0.5, -0.5, 0.5,1]
        ])
        this.updateTransformation(obj)
        

    }
    static bindObject3d(obj,padding=new Vector3([0,0,0])){  
        
        return new BoundingBox(obj,padding )

    }
    static bindSubMesh(object,group,padding=new Vector3([0,0,0])){  
            

        
        
        
      

        let obj = {
            scale: object.scale.copy(),
            position: object.position.copy(),
            rotation: object.rotation.copy(),
            dimension: group.dimension,
            center:new Vector3([0,0,0]),
            isGroup:true
        };
        obj.dimension.update=function (){
                const min=this.dimension.min
                const max=this.dimension.max
                let vertices=new Matrix([
                    [min.x,min.y,min.z,1],
                    [max.x,max.y,max.z,1],
                ])
                let transformation = Scale(this.scale);       
                transformation = transformation.multiply(rotate_y(this.rotation.y));
                transformation = transformation.multiply(Translate(this.position));
                vertices=vertices.multiply(Translate(this.center))
                vertices = vertices.multiply(transformation);

                return{
                    min:new Vector3([vertices.data[0][0],vertices.data[0][1],vertices.data[0][2]]),
                    max:new Vector3([vertices.data[1][0],vertices.data[1][1],vertices.data[1][2]]),
                }
        }
        return new BoundingBox(obj, padding);
    
    }
    setVertices(obj){
        let min = obj.min;
        let max = obj.max;
      
        this.vertices = new Matrix([
            [max.x, max.y, min.z, 1],
            [max.x, min.y, min.z, 1],
            [max.x, max.y, max.z, 1], // max
            [max.x, min.y, max.z, 1],
            [min.x, max.y, min.z, 1],
            [min.x, min.y, min.z, 1], // min
            [min.x, max.y, max.z, 1],
            [min.x, min.y, max.z, 1]
        ]);
    }
    setWorldAABB() {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let row of this.vertices.data) {
            let x = row[0], y = row[1], z = row[2];
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
        }

        this.min= new Vector3([minX, minY, minZ])
        this.max= new Vector3([maxX, maxY, maxZ])
    }
    updateTransformation(obj){
        obj=obj.dimension.update.bind(obj)
        this.setVertices(obj())
    //apply transformation to bounding box     

        this.setWorldAABB()
    }
    intersects(otherBox) {
        let boxA = this;
        let boxB = otherBox;
            let pad=0 
        // Standard 3D AABB collison check
        return (
            (boxA.min.x+pad <= boxB.max.x && boxA.max.x-pad >= boxB.min.x) &&
            //(boxA.min.y+pad <= boxB.max.y && boxA.max.y-pad >= boxB.min.y) &&
            (boxA.min.z+pad <= boxB.max.z && boxA.max.z-pad >= boxB.min.z)
        );
    }

}

export  function RigidBody3D(obj3d){
    return {...
        {
          type:"RIGID_BODY_3D",
          velocity:new Vector3([0,0,0]),
          angularVelocity:new Vector3([0,0,0]),
          movmentSpeed:2,
          direction:new Vector3([0,0,0]),
          boundingBox:new BoundingBox.bindObject3d(obj3d),
          lookAt(position, target, up) {
                target=target.copy()
               // The famous lookat matrix which orient (rotate ) an object to face a particular point
                if(target.isOrigin()) target=new Vector3([0,0,1]) // if target is at origin take a forward axis by default   
                if(!(position.type=="SigerVector3"&&target.type=="SigerVector3" &&up.type=="SigerVector3")) throw new Error("Siger Error: One or more arguments are not of type SigerVector3")
                var zAxis = target.copy().normalize();
                var xAxis = up.crossProduct(zAxis).normalize();
                var yAxis = zAxis.crossProduct(xAxis).normalize();
                
                this.transposeMatrix.rotationMatrix=new Float32Array([
                  xAxis.x, xAxis.y, xAxis.z, 0,
                  yAxis.x, yAxis.y, yAxis.z, 0,
                  zAxis.x, zAxis.y, zAxis.z, 0,
                  0,0,0,1,
                ]);

                
          },
          update(){
              this.velocity=this.direction.multiplyInt(this.movmentSpeed)
              this.angularVelocity=this.velocity
              this.translate(this.position.plus(this.velocity))

          },
          invokeFPSControll(){
            var body=this
            
            document.addEventListener("keydown", function(event) {

                 if (event.code === "KeyW") {
                    
                    body.direction=new Vector3([0,0,1])
                 }
                 else if (event.code === "KeyS") {
                    
                    body.direction=new Vector3([0,0,-1])
                 }
                 if (event.code === "KeyA") {
                    
                    body.direction=new Vector3([-1,0,0])
                 }
                 else if (event.code === "KeyD") {
                    
                    body.direction=new Vector3([1,0,0])
                 }
                 body.movmentSpeed=2
                

            })
            document.addEventListener("keyup", function(event) {
                 body.movmentSpeed=0


            })

        }//end of invokeFPS
    },...obj3d}//end of rigidBody object

    
    

}
export  function MapEntity(obj,_Map){
   return {...obj,...
    {
        map:_Map,
        indexMap:_Map.mapObjects.length,
        isMapEntity:true,
        


            /**
                *@param {Array} Cell in which the object is to be duplicated
                *@param {position,rotation,scale} transformation vectors
                *@param {boolean} boundingBox whether to create a bounding box for the duplicate
                *@@return {WorldEntity} Duplicates an object in the world
            */
 
        duplicate(Cell,transformation={},boundingBox=true){
            let duplicateEntity=duplicateObject(this,transformation)
            duplicateEntity=new MapEntity(duplicateEntity,this.map)
            duplicateEntity.cell=Cell
            duplicateEntity.BoundingBox=boundingBox   
            this.isBase=true
            this.map.mapObjects.push(duplicateEntity)
           
            
            return duplicateEntity


        },
        delete(){
            SigerGlobalManager.shaderDataManager.GlobalVbo.registerFreeRAM(this)
            this.world.normalModels.splice(1,this.index)

        }


        
    }}
    

}
export  function WorldEntity(obj,world){
   return {...obj,...
    {
        world:world,
        index:world.renderings.normalModels.length,
        isWorldEntity:true,
           /**
                *@param {{position,rotation,scale}} transformation vectors
                *@@return {WorldEntity} Duplicates an object in the world
            */
        updateDimension(){
            this.dimension.min.x=this.position.x-this.dimension.size.x/2
            this.dimension.min.y=this.position.y-this.dimension.size.y/2
            this.dimension.min.z=this.position.z-this.dimension.size.z/2

            this.dimension.max.x=this.position.x+this.dimension.size.x/2
            this.dimension.max.y=this.position.y+this.dimension.size.y/2
            this.dimension.max.z=this.position.z+this.dimension.size.z/2
        },
        duplicate(transformation={}){
            let duplicateEntity=new WorldEntity(this,this.world)
            duplicateEntity.position=transformation.position??this.position.copy()
            duplicateEntity.rotation=transformation.rotation??this.rotation.copy()
            duplicateEntity.scale=transformation.scale??this.scale.copy()
            duplicateEntity.transposeMatrix={//gpu matricies

                     scaleMatrix: null,
                     translateMatrix: null,
                     rotationMatrix:null,
                     previousPos:new Vector3([-1,-1,-1]),
                     previousRotation:new Vector3([-1,-1,-1]),
                     previousScale:[-1,-1,-1],
               }
            duplicateEntity.updateTransformation()
            duplicateEntity.isDuplicate=true
            this.isBase=true
            duplicateEntity.baseModel=this
            duplicateEntity.index=this.world.renderings.normalModels.length
            this.world.renderings.normalModels.push(duplicateEntity)//add the model to world:)
            SigerGlobalManager.shaderDataManager.GlobalVbo.UnParsedModels.push(duplicateEntity)

            return duplicateEntity


        },
        delete(){
            SigerGlobalManager.shaderDataManager.GlobalVbo.registerFreeRAM(this)
            this.world.normalModels.splice(1,this.index)

        }

        
    }}
    

}
export async function Geometry3D(name,params={}) {
        return await Object3D(`Siger/library/geometries/${name}.obj`,params)
}