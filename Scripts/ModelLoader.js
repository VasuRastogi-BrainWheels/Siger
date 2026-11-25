
import {Vector3} from "./Vector.js"
import {SigerGlobalManager} from "./siger.js"

function readFile(path){
  
  return new Promise(resolve=>{
    fetch(path).then(r => {
      if(!r.ok) return "Code:404"// if response throw error file doesnt exist
      return r.text()//read the text of response
    })
    .then(text => {
        resolve(text)//resolve promise by returning text 
    })
    .catch(_err=>{
        let text=`Code:404`;
        resolve(text)

    })
    
  })
      
}
//read the OBJ file and parse it
function OBJparser(text,material) {
  let getGroupDimension = function() {
      return {
          minX: Infinity, maxX: -Infinity,
          minY: Infinity, maxY: -Infinity,
          minZ: Infinity, maxZ: -Infinity,
          LHB: []
      }
  }

  let dimension = {
      minX: Infinity, maxX: -Infinity,
      minY: Infinity, maxY: -Infinity,
      minZ: Infinity, maxZ: -Infinity,
      LHB: []
  }
  let getGroupTransformation=function(){
    return{
        position:new Vector3([0,0,0]),
        rotation:new Vector3([0,0,0]),
        size:new Vector3([1,1,1]),
    }
  }
  function getNewGroup(){
        return {//initialize the group with its dimension and transformation
          dimension:getGroupDimension(),
          transformation:getGroupTransformation(),
          center:null
        }
  }

  function parseGroupDimension(dimension){
        dimension.LHB=new Vector3([dimension.maxX-dimension.minX,dimension.maxY-dimension.minY,dimension.maxZ-dimension.minZ])
        currentGroup.dimension={
          size:dimension.LHB,
          min:new Vector3([dimension.minX,dimension.minY,dimension.minZ]),
          max:new Vector3([dimension.maxX,dimension.maxY,dimension.maxZ])
        }
  }

  let go;
  let colorIndex=0
  let currentMaterialIndex=0
  let currentMaterial
  let currentGroup=getNewGroup()


  
  const Output={
  isMesh:true,
  polygons : [],
  texturePolygon: [],
  normalPolygon :[],
  group_material_map:[],
  Materials:material,
  groups:{},
  colorPallete:[]
}
  var geometry={ 
    Vertex:[[0,0,0,0]],
    Faces:[],
    
    VertexTex:[[0,0,0,0]],
    
    
    VertexNorm:[[0,0,0,0]],
    Materials:material
  }
  function addVertex(enteries){
    
      let fv=enteries.split("/")[0]
      let fvt=enteries.split("/")[1]
      let fvn=enteries.split("/")[2]
      
      if(fvt==""||!fvt||!currentMaterial.hasTexture){
        fvt=0
      }
      if(fvn==""||!fvn){
        fvn=0
      }
      
      const v=geometry.Vertex[fv]
      let vt=geometry.VertexTex[fvt]
      const vn=geometry.VertexNorm[fvn]
    //check and set dimension for whole mesh
      if(v[0]<dimension.minX)dimension.minX=v[0] 
      else if(v[0]>dimension.maxX)dimension.maxX=v[0]

      if(v[1]<dimension.minY)dimension.minY=v[1] 
      else if(v[1]>dimension.maxY)dimension.maxY=v[1]

      if(v[2]<dimension.minZ)dimension.minZ=v[2] 
      else if(v[2]>dimension.maxZ)dimension.maxZ=v[2]    
    // check and set dimension for current group
      if (v[0]<currentGroup.dimension.minX)currentGroup.dimension.minX=v[0] 
      else if(v[0]>currentGroup.dimension.maxX)currentGroup.dimension.maxX=v[0]

      if(v[1]<currentGroup.dimension.minY)currentGroup.dimension.minY=v[1] 
      else if(v[1]>currentGroup.dimension.maxY)currentGroup.dimension.maxY=v[1]

      if(v[2]<currentGroup.dimension.minZ)currentGroup.dimension.minZ=v[2]
      else if(v[2]>currentGroup.dimension.maxZ)currentGroup.dimension.maxZ=v[2]
      Output.polygons.push(v[0])
      Output.polygons.push(v[1])
      Output.polygons.push(v[2])
      Output.polygons.push(1)
      //alert(v)
  //
      Output.texturePolygon.push(vt[0])
      Output.texturePolygon.push(vt[1])
      Output.texturePolygon.push(currentMaterialIndex)
      Output.texturePolygon.push(1)
      
      Output.normalPolygon.push(vn[0])
      Output.normalPolygon.push(vn[1])
      Output.normalPolygon.push(vn[2])
      Output.normalPolygon.push(1)

  }
//here we define the keyword parsers i.e each keyword has its own parser
    const keywordParser={
      usemtl:function(name){
        name=name.join("_").trim()
        name=name.replace(".","_")//replace . with _ 
        
        if(!geometry.Materials.map[name])//use defaultMaterial if material specified doesn't exist 
          name="_SigerDefault"
         
        colorIndex=(1/geometry.Materials.count)*(geometry.Materials.map[name].index)
        
        
        currentMaterialIndex=geometry.Materials.map[name].index//
        currentMaterial=geometry.Materials.map[name]
       
        
        
      },
      o:function(name){
        parseGroupDimension(currentGroup.dimension)//parse the dimension of the previous group before creating a new group
        currentGroup.center=new Vector3([(currentGroup.dimension.min.x+currentGroup.dimension.max.x)/2,(currentGroup.dimension.min.y+currentGroup.dimension.max.y)/2,(currentGroup.dimension.min.z+currentGroup.dimension.max.z)/2])
        name=name.join("_").trim().replace(".","_")//get the name of group
        Output.groups[name]=getNewGroup()
        currentGroup=Output.groups[name]//set the current group to the newly created group
        
      },
      g:function(name){
        parseGroupDimension(currentGroup.dimension)//parse the dimension of the previous group before creating a new group
        currentGroup.dimension.center=new Vector3([(currentGroup.dimension.min.x+currentGroup.dimension.max.x)/2,(currentGroup.dimension.min.y+currentGroup.dimension.max.y)/2,(currentGroup.dimension.min.z+currentGroup.dimension.max.z)/2])
        name=name.join("_").trim().replace(".","_")//get the name of group
        Output.groups[name]=getNewGroup()
        currentGroup=Output.groups[name]//set the current group to the newly created group
 
      },
      v:(enteries)=>
      {
        const vList=[]
        enteries.forEach((p)=>{
          if(p=="v") return
          vList.push(parseFloat(p))//push x y z in list
        })
        vList.push(1)
        geometry.Vertex.push(vList)
        
        
      },
//vertex textures
      vt:(enteries)=>
      {
        const vList=[]
        enteries.forEach((p)=>{
          if(p=="vt") return
          vList.push(parseFloat(p))//push x y z in list
        })
        vList.push(1)
        geometry.VertexTex.push(vList)
        
      },
//vertex normals 
      vn:(enteries)=>
      {
        const vList=[]
        enteries.forEach((p)=>{
          if(p=="vn") return
          vList.push(parseFloat(p))//push x y z in list
        })
        vList.push(1)
        geometry.VertexNorm.push(vList)
        
      },
//faces
      f:(enteries)=>{
     
      
        const numTriangles=enteries.length-2
        for (let tri = 0; tri < numTriangles; ++tri) 
        {
          addVertex(enteries[0]);
          addVertex(enteries[tri + 1]);
          addVertex(enteries[tri + 2]);
       }         
          //console.log(geometry.Faces)
          
          
 
        
      }
      //
    }
    const data=text.split("\n")//read file line by line
  
    for (let line of data) {
      line=line.trim()//remove unnecessary white space before and after
      const parts = line.split(/\s+/);  /* Split by any whitespace*/
      const keyword = parts[0];
      const args = parts.slice(1);
      

      
      if(!line||line.startsWith("#")) continue//dont parse if line is empty or in comment
      if(keyword in keywordParser)//check if there is a parser for the keyword
       {
          keywordParser[keyword](args)//if yes parse it
         // break
       }

    }
    parseGroupDimension(currentGroup.dimension)//parse the dimension of the last group after finishing parsing the file
    currentGroup.dimension.center=new Vector3([(currentGroup.dimension.min.x+currentGroup.dimension.max.x)/2,(currentGroup.dimension.min.y+currentGroup.dimension.max.y)/2,(currentGroup.dimension.min.z+currentGroup.dimension.max.z)/2])
    dimension.LHB=new Vector3([dimension.maxX-dimension.minX,dimension.maxY-dimension.minY,dimension.maxZ-dimension.minZ])
    Output.dimension={
      size:dimension.LHB,
      center:new Vector3([(dimension.minX+dimension.maxX)/2,(dimension.minY+dimension.maxY)/2,(dimension.minZ+dimension.maxZ)/2]),
      min:new Vector3([dimension.minX,dimension.minY,dimension.minZ]),
      max:new Vector3([dimension.maxX,dimension.maxY,dimension.maxZ]),

    }
    
    return Output//parsedObj.parse()

    
}
async function MTLparser(text,path) {
  let directory=path.slice(0,path.lastIndexOf("/"))
  const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        
        // Resolve the promise once the image finishes loading
        img.onload = () => resolve(img);
        
        // Reject the promise if the file fails to load
        
        img.onerror = (err) => reject(err);
      });
  };


    const defaultMaterial =function (name,I,parent) {
     return { 
      name:name,
      index: I,
      parent:parent,
      diffuse: [1, 1, 1],
      ambient: [0, 0, 0],
      specular: [0, 0, 0],
      emissive: [0, 0, 0],
      shininess: 400,
      opacity: 1,
      hasTexture:false,
      textures:{
        diffuse:{
            textureId:"Siger_Default_Diffuse_Texture",
            textureDimension:[0,0,1,1],//x,y(pos of texture in cluster),width,height of texture(by default,for those models who dont use textures ,1x1 white pixel is used)
            img:null
        },
      
      }, 
      clone(){
        let orignal=this
        let cloned=
        {
            name:orignal.name,
            index:orignal.index,
            parent:orignal.parent,
            diffuse:[...orignal.diffuse],
            ambient:[...orignal.ambient],
            specular:[...orignal.specular],
            emissive:[...orignal.emissive],
            shinines:orignal.shininess, 
            opacity:orignal.opacity,       
            hasTexture:orignal.hasTexture,
            textures:{
              diffuse:{
                  textureId:orignal.textures.diffuse.textureId,
                  textureDimension:[...orignal.textures.diffuse.textureDimension],//x,y(pos of texture in cluster),width,height of texture(by default,for those models who dont use textures ,1x1 white pixel is used)
              
              },
          
          },
        }

        return{...orignal,...cloned}
      },
      /**
        * @param {Image} img - The image to be used as texture
      */
      useLoadedTexture(img){
       //handle errors
        if (!img.complete) throw new Error(`Siger Error:Cannot not apply material.useLoadedTexture on material ${this.name}.The image is not loaded yet`)
        this.hasTexture=true
      // assign image and update texture object
        this.textures.diffuse.img=img
        let path=img.src.split("/")
        this.textures.diffuse.textureId=path[path.length-1].replace(".","_")
        this.textures.diffuse.textureDimension=[0,0,img.width,img.height]
        this.parent._Parse()
      }
      
     }
    };

  let Materials = {
    count: 0,
    map:{},//maps the material name with its data  
    rawData:[],//data in form of array which can be modified
    gpuData:new Float32Array(20*24),//max 15 materials*5 vec4(*4) for each material(diffuse,ambient, specular ,emissive & texDimension)
    changeProperty(material,property,value){
      let dataStructure={
        diffuse:16,//byteSize
        ambient:16,
        specular:16,
        emmissive:16,
      }
    // Check validation 
      if(!this.map[material]) throw new Error("Siger Error:The Material specified doesnt exist in current mesh.\nUse Mesh.materials.logNames() to get list of materials")
      if (!dataStructure[property])throw new Error("Siger Error: Invalid property passed to the materials.changeProperty")
      if (dataStructure[property]==16 && !Array.isArray(value)) throw new Error(`Siger Error:Invalid value passed to  materials.changeProperty for property ${property}.\nExpected:Array  Got:${typeof value}`)
      if (dataStructure[property]==16 && value.length!=3) throw new Error(`Siger Error:Invalid value passed to  materials.changeProperty The Array must have length 3 got ${value.length}`)
      
    //update the material property
      this.map[material][property]=value
       this._Parse()//parse the material again 
   
    },
    _Parse(){
        Object.values(this.map).forEach((m,i)=>{
         //store the colors in Float32Array
            this.gpuData.set( [m.diffuse[0],m.diffuse[1],m.diffuse[2],1], i*24+0);
            this.gpuData.set( [m.ambient[0],m.ambient[1],m.ambient[2],1], i*24+4);
            this.gpuData.set( [m.specular[0],m.specular[1],m.specular[2],1], i*24+8);
            this.gpuData.set( [m.emissive[0],m.emissive[1],m.emissive[2],1], i*24+12);   
          // add the texture to texture atlas    
            m.diffuse.textureDimension=SigerGlobalManager.shaderDataManager.textureUnit.diffuseTexture.addTexture(m.textures.diffuse)
          // store the texture dimension
            this.gpuData.set(SigerGlobalManager.shaderDataManager.textureUnit.diffuseTexture.addTexture(m.textures.diffuse), i*24+16);
            this.gpuData.set( [m.shininess,m.opacity,m.hasTexture,1], i*24+20);
        });
    },
    hasMaterial(name){
      return name in this.map
    },
    /**
      *@param {string} name - The name of Material
      * @returns {Object} The material Object
    */
    getMaterial(name){
      if(!this.map[name]) throw new Error("Siger Error:The Material specified doesnt exist in current mesh.\nUse Mesh.materials.logNames() to get list of materials")
      return this.map[name]
    },
    /**
      
      * Logs the name of materials present in current mesh
    */
    logNames(){
      let materialNames=''
      for(const name of Object.keys(this.map)){
        materialNames+=`${name}\n`
        
      }
      console.log(materialNames)
    },
    /**
      
      * Deep copy the materials
    */
    clone() {
      const original = this;
      const clonedMap = {};
      // Clone each material entry 
      const clonedEntries = original.rawData.map((mat) => {
        let cloned=mat.clone()//clone the material
        clonedMap[cloned.name]=cloned//set it in map
        
        return cloned//return  cloned map
      });

    return {
      ...original,
      count: original.count,
      map: clonedMap,
      rawData: clonedEntries,
      gpuData: new Float32Array(original.gpuData),
    };
}
  };
  
  let currentMaterial= "";
  const data = text.split("\n");
  
  const keywordParser = {
    newmtl: function(parts) {
      let name = parts.join("_");
      name=name.replace(".","_")//replace . with _
      Materials.rawData.push(new defaultMaterial(name,Materials.count,Materials));//use siger default material as base for every new metarial
      Materials.count += 1;
      currentMaterial = Materials.rawData[Materials.rawData.length-1];
      Materials.map[name]=currentMaterial
    },
    
    // Colors (RGB)
    Ka: function(rgb) { currentMaterial.ambient = rgb.map(parseFloat); },
    Kd: function(rgb) {
      const color = rgb.map(parseFloat);
      currentMaterial.diffuse = color;

    },
    Ks: function(rgb) { currentMaterial.specular= rgb.map(parseFloat); },
    Ke: function(rgb) { currentMaterial.emissive = rgb.map(parseFloat); },
    
    // Single Values
    Ns: function(val) { currentMaterial.shininess = parseFloat(val[0]); },
    Ni: function(val) { currentMaterial.opticalDensity = parseFloat(val[0]); },
    d: function(val) { currentMaterial.opacity = parseFloat(val[0]); },
    illum: function(val) { currentMaterial.illum = parseInt(val[0]); },
    map_Kd:async function (address) {
        const img=await loadImage(`${directory}/${address[0]}`)
      
       currentMaterial.hasTexture=true
       currentMaterial.textures.diffuse.textureId=address[0].replace(".","")
      
       currentMaterial.textures.diffuse.img=img
       currentMaterial.diffuse=[1,1,1]//switch to white to prevent color overlap error
       currentMaterial.textures.diffuse.textureDimension=[0,0,img.width,img.height]
       //console.log(currentMaterial.textures.diffuse.img.currentSrc )}
    
  }};
  
  
  
  for (let line of data) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    
    const parts = line.split(/\s+/);  // Split by any whitespace
    const keyword = parts[0];
    const args = parts.slice(1);
    
    if (keyword in keywordParser) {
     await keywordParser[keyword](args);
    }
  }
  //console.log(Materials.colorPallete)
  return Materials;
}
export async function loadMtl(path) {
// read the mtl file
  let data=await readFile(path+".mtl")
//assign a default material
  const defaultMaterial=`
newmtl _SigerDefault
Ns 250.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.500000 0.500000 0.500000
Ke 0.000000 0.000000 0.000000
Ni 1.450000
d 1.000000
illum 2
  
 `
// if file not found fill data with default material
  if (data=="Code:404")  data=defaultMaterial
  else data=defaultMaterial+"\n" + data// else add default material at rtop of dat
 // console.log(data)
  return await  MTLparser(data,path)
  
}
export async function loadOBJ(path,type="") {
  const data=await readFile(path)
  if (data=="Code:404") throw new Error(`Siger Error: The model ${path} doesnt exist`)
  const attachedMTL=await loadMtl(path.replace(".obj",""))
  if(path.endsWith(".obj")|| type=="obj"){

    return OBJparser(data,attachedMTL)
  }
}

export  class LoadMultiMesh{
  /**
    *@param {Object} MeshesDataObject - The structured plain js obj {
  Karts:{
    directory:"models/Cars",
    type:"obj",
    Map:{
      Orange:"Race_Orange",
      Cooper:"Race_Cooper",
      Sky:"Race_Sky",
      Blue:"Race_Blue",
      White:"Race_White",
    }
  },
  Buildings:{
    directory:"models/buildings",
    type:"obj",
    Map:{
      E:"E",
      F:"F",
      D:"D",
    },
  }
 
  
} 
  */
  static async FromSubObjects(MeshesDataObject){
    let ToLoadMeshesData=[]//[MeshPath,category it belongs to, mesh name]
    // loop trough all categories
    for (const category of Object.keys(MeshesDataObject)) {
      let categoryData=MeshesDataObject[category]
      let currentMeshes=categoryData.Map
    //loop through all meshes in the category
      for (const [MeshName, filePath] of Object.entries(currentMeshes)) {
          let meshPath=`${categoryData.directory}/${filePath}.${categoryData.type}`
          let index=ToLoadMeshesData.push([meshPath,category,MeshName])-1//store their path and note index 
          currentMeshes[MeshName]=index
      }//nested for loop ends
    }//main for loop ends
    let MeshLoadPromise=ToLoadMeshesData.map(data=>loadOBJ(data[0],"obj"))
    let loadedMeshesDataArray = await Promise.all(MeshLoadPromise);//wait for all meshes to be completely parsed
    let finalMeshData={}/*
        Cars:{
            Orange:{ 
              isMesh:true,
              polygons : [],
              texturePolygon: [],
              normalPolygon :[],
              group_material_map:[],
              Materials:material,
              groups:{},
              colorPallete:[]
            }
            Red:{
              isMesh:true,
              polygons : [],
              texturePolygon: [],
              normalPolygon :[],
              group_material_map:[],
              Materials:material,
              groups:{},
              colorPallete:[]
            }

            
        }
    */

    ToLoadMeshesData.forEach((data,i)=>{
        if(!finalMeshData[data[1]])finalMeshData[data[1]]={}//add the category object if not exist
        finalMeshData[data[1]][data[2]]=loadedMeshesDataArray[i]
    })
    return finalMeshData
  }
}
