import {rotate_y,rotate_x} from "./Transform.js"   
import {Matrix} from "./Matrix.js"
  
import {Vector3} from "./Vector.js"
export class PerspectiveCamera {
  
    constructor(render, pos, attributes = {}) {
        this.render = render;
        this.position = new Vector3(pos);
        this.rotation = new Vector3([0, 0, 0]);
        this.HorFov = attributes.HorFov || Math.PI / 3;
        this.VertFov = attributes.VertFov || (Math.PI / 3) * (render.height / render.width);
        this.near_plane = attributes.near_plane || 0.01;
        this.far_plane = attributes.far_plane || 800;
        this.moving_speed = attributes.moving_speed || 1;
        this.rotation_speed = attributes.rotation_speed || 0.025;
        this.direction = attributes.direction || "";
        this.mountedTo = null;
        this.mountedDistance = 0;
        this.focalLength = attributes.focalLength || 1.0;
        this.mountedOffset = attributes.mountedOffset || new Vector3([0, 0, 0]);
    

        this._GlMatrix = this.matrix().getFloat32Array();
    }

    setPosition(pos) {
        this.position = pos;
    }

    getGLMatrix() {
        return this.matrix().getFloat32Array();
    }

    mountTo(obj, offset = new Vector3([0, 0, 0])) {
        if (!obj.isWorldEntity) throw new Error("Siger Error: At Camera.MountTo(), Argument 1 must be a WorldEntity");
        if (offset.type !== "SigerVector3") throw new Error("Siger Error: At Camera.MountTo(), Argument 2 must be a SigerVector3");
        this.mountedTo = obj;
        this.mountedOffset = offset.copy();
        let pos = this.mountedTo.position;
        this.mountedDistance = pos.distanceTo(this.mountedTo.position.minus(offset));
    }

    lookAt(position, target, up) {
        target = target.copy();
        if (target.isOrigin()) target = new Vector3([0, 0, 1]);
        if (!(position.type === "SigerVector3" && target.type === "SigerVector3" && up.type === "SigerVector3")) {
            throw new Error("Siger Error: One or more arguments are not of type SigerVector3");
        }
        var zAxis = target.copy().normalize();
        var xAxis = up.crossProduct(zAxis).normalize();
        var yAxis = zAxis.crossProduct(xAxis).normalize();
        
        this._GlMatrix = new Float32Array([
            xAxis.x, xAxis.y, xAxis.z, 0,
            yAxis.x, yAxis.y, yAxis.z, 0,
            zAxis.x, zAxis.y, zAxis.z, 0,
            position.x, position.y, position.z, 1,
        ]);
    }

    control(dir = this.direction) {
        let fwdX = -Math.sin(this.rotation.y);
        let fwdZ = -Math.cos(this.rotation.y);
        let rightX = Math.cos(this.rotation.y);
        let rightZ = -Math.sin(this.rotation.y);

        if (dir == "left") {
            this.position.x -= rightX * this.moving_speed;
            this.position.z -= rightZ * this.moving_speed;
        } else if (dir == "right") {
            this.position.x += rightX * this.moving_speed;
            this.position.z += rightZ * this.moving_speed;
        }
        if (dir == "forward") {
            this.position.x += fwdX * this.moving_speed;
            this.position.z += fwdZ * this.moving_speed;
        }
        if (dir == "backward") {
            this.position.x -= fwdX * this.moving_speed;
            this.position.z -= fwdZ * this.moving_speed;
        }
        if (dir == "up") {
            this.position.y += this.moving_speed;
        }
        if (dir == "down") {
            this.position.y -= this.moving_speed;
        }
        if (dir == "down") {
            this.position.subtract(this.up.multiplyInt(this.moving_speed));
        }

        if (dir == "rotR") {
            this.rotation.y -= this.rotation_speed;
        }
        if (dir == "rotL") {
            this.rotation.y += this.rotation_speed;
        }
        if (dir == "rotUp") {
            this.rotation.z -= this.rotation_speed;
        }
        if (dir == "rotDown") {
            this.rotation.z += this.rotation_speed;
        }

        this._GlMatrix = this.matrix().getFloat32Array();
        if (!this.mountedTo) return;
        this.position = this.mountedTo.position.copy();

        this.rotation.y = -this.mountedTo.rotation.y;
        this.position.x += Math.cos(90 * Math.PI / 180 + this.mountedTo.rotation.y) * this.mountedDistance;
        this.position.z -= Math.sin(90 * Math.PI / 180 + this.mountedTo.rotation.y) * this.mountedDistance;
        this.position.y += this.mountedOffset.y;
        this._GlMatrix = this.matrix().getFloat32Array();
    }

    invokeFPSControll() {
        var cam = this;
        document.addEventListener("keydown", function(event) {
            if (event.code === "KeyW") cam.direction = "forward";
            if (event.code === "KeyS") cam.direction = "backward";
            if (event.code === "KeyA") cam.direction = "left";
            if (event.code === "KeyD") cam.direction = "right";
            if (event.code === "ArrowUp") cam.direction = "up";
            if (event.code === "ArrowDown") cam.direction = "down";
            if (event.code === "ArrowLeft") cam.direction = "rotL";
            if (event.code === "ArrowRight") cam.direction = "rotR";
        });
        document.addEventListener("keyup", function(event) {
            cam.direction = "";
        });
    }

    To_defaultPos() {
        this.forward = new Vector3([0, 0, 1]);
        this.up = new Vector3([0, 1, 0]);
        this.right = new Vector3([1, 0, 0]);
    }

    update_axii() {
        let rotate = (rotate_x(this.rotation.x)).multiply(rotate_y(this.rotation.y));
        this.To_defaultPos();
        this.forward = this.forward.crossProduct(rotate);
        this.right = this.right.crossProduct(rotate);
        this.up = this.up.crossProduct(rotate);
    }

    matrix() {
        return this.translate_matrix().multiply(this.rotateY_matrix().multiply(rotate_x(this.rotation.x)));
    }

    translate_matrix() {
        let Cx = this.position.x;
        let Cy = this.position.y;
        let Cz = this.position.z;

        return new Matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [-Cx, -Cy, -Cz, 1]
        ]);
    }

    rotateY_matrix(type = "Float") {
        let s = Math.sin(this.rotation.y);
        let c = Math.cos(this.rotation.y);

        return new Matrix([
            [c, 0, -s, 0],
            [0, 1, 0, 0],
            [s, 0, c, 0],
            [0, 0, 0, 1]
        ]);
    }

    projectionMatrix() {
        let NEAR = this.near_plane;
        let FAR = this.far_plane;
        let RIGHT = Math.tan(this.HorFov / 2);
        let LEFT = -RIGHT;
        let TOP = Math.tan(this.VertFov / 2);
        let BOTTOM = -TOP;

        let m00 = 2 / (RIGHT - LEFT);
        let m11 = 2 / (TOP - BOTTOM);
        let m22 = (FAR + NEAR) / (FAR - NEAR);
        let m32 = -2 * NEAR * FAR / (FAR - NEAR);
        return new Float32Array([
            m00, 0, 0, 0,
            0, m11, 0, 0,
            0, 0, m22, 1,
            0, 0, m32, 0
        ]);
    }
}
export class OrthographicCamera{
  constructor(render,pos){
    this.render=render
    this.position=new Vector3(pos)
    this.rotation=new Vector3([0,0,0])
    
    this.width=render.width
    this.height=render.height
    this.near=200
    this.far=-200
    this.left=0
    this.right=this.width
    this.top=0
    this.bottom=this.height
    this.moving_speed = 1
    this.rotation_speed = 0.025
    this.direction=""
    this.mountedTo=null
    this.mountedDistance=0
    this.focalLength=1.0
    this.mountedOffset=new Vector3([0,0,0])
    this._GlMatrix=null
  }
  getGLMatrix(){
        return this.matrix().getFloat32Array()
      }
  mountTo(obj,offset=new Vector3([0,0,0])){
          
          if(!obj.isWorldEntity) throw new Error("Siger Error:At Camera.MountTo() ,Argument 1 must be a WorldEntity")
          if(offset.type!="SigerVector3") throw new Error("Siger Error:At Camera.MountTo() ,Argument 2 must be a SigorVector3")
          this.mountedTo=obj
          this.mountedOffset=offset.copy()
          let pos=this.mountedTo.position
          // pos.y=0
          // offset.y=0
          this.mountedDistance=pos.distanceTo(this.mountedTo.position.minus(offset))

      }
  lookAt(position, target, up) {
          target=target.copy()
          // The famous lookat matrix which orient (rotate ) an object to face a particular point
          if(target.isOrigin()) target=new Vector3([0,0,1]) // if target is at origin take a forward axis by default   
          if(!(position.type=="SigerVector3"&&target.type=="SigerVector3" &&up.type=="SigerVector3")) throw new Error("Siger Error: One or more arguments are not of type SigerVector3")
          var zAxis = target.copy().normalize();
          var xAxis = up.crossProduct(zAxis).normalize();
          var yAxis = zAxis.crossProduct(xAxis).normalize();
          
          this._GlMatrix=new Float32Array([
            xAxis.x, xAxis.y, xAxis.z, 0,
            yAxis.x, yAxis.y, yAxis.z, 0,
            zAxis.x, zAxis.y, zAxis.z, 0,
            position.x,position.y,position.z,1,
          ]);

    }
  control(dir=this.direction)
      {
          //this.pos -= this.forward.multiply(this.moving_speed)




          
          let fwdX = -Math.sin(this.rotation.y);
          let fwdZ = -Math.cos(this.rotation.y);
          let rightX = Math.cos(this.rotation.y);
          let rightZ = -Math.sin(this.rotation.y);

          if (dir == "left") {
              this.position.x -= rightX * this.moving_speed;
              this.position.z -= rightZ * this.moving_speed;
          }
          else if (dir == "right") {
              this.position.x += rightX * this.moving_speed;
              this.position.z += rightZ * this.moving_speed;
          }
          if (dir == "forward") {
              this.position.x += fwdX * this.moving_speed;
              this.position.z += fwdZ * this.moving_speed;
          }
          if (dir == "backward") {
              this.position.x -= fwdX * this.moving_speed;
              this.position.z -= fwdZ * this.moving_speed;
          }
          if (dir == "up") {
              this.position.y += this.moving_speed;
          }
          if (dir == "down") {
              this.position.y -= this.moving_speed;
          }
          if (dir=="down")
          {
            this.position.subtract(this.up.multiplyInt(this.moving_speed))
            
          }

          if (dir=="rotR")
          {
              
              this.rotation.y-=this.rotation_speed
              
          }
          if (dir=="rotL")
          {
          
            this.rotation.y+=this.rotation_speed
              
          }
          
          if (dir=="rotUp")
          {
             
              this.rotation.z-=this.rotation_speed
          }
          if (dir=="rotDown")
          {
              
              this.rotation.z+=this.rotation_speed
          }
            this._GlMatrix = this.matrix().getFloat32Array();
            if(! this.mountedTo) return
            this.position=this.mountedTo.position.copy()

            this.rotation.y=-this.mountedTo.rotation.y
            this.position.x+=Math.cos(90*Math.PI/180+this.mountedTo.rotation.y)*this.mountedDistance
            this.position.z-=Math.sin(90*Math.PI/180+this.mountedTo.rotation.y)*this.mountedDistance
            this.position.y+=this.mountedOffset.y
            this._GlMatrix = this.matrix().getFloat32Array();
    }
  invokeFPSControll(){
        var cam=this
        
        document.addEventListener("keydown", function(event) {
         if (event.code === "KeyW") {
            
            cam.direction="forward"
         }
         if (event.code === "KeyS") {
            
            cam.direction="backward"
         }
         if (event.code === "KeyA") {
            
            cam.direction="left"
         }
         if (event.code === "KeyD") {
            
            cam.direction="right"
         }
         if (event.code === "ArrowUp") {
            
            cam.direction="up"
         }
         if (event.code === "ArrowDown") {
            
            cam.direction="down"
         }
         if (event.code === "ArrowLeft") {
            
            cam.direction="rotL"
         }
         if (event.code === "ArrowRight") {
            
            cam.direction="rotR"
         }        

        })
        document.addEventListener("keyup", function(event) {
              cam.direction=""


        })


      }

  To_defaultPos()
      {
      
          this.forward = new Vector3([0, 0, 1])
          this.up = new Vector3([0, 1, 0])
          this.right = new Vector3([1, 0, 0])
      }
  update_axii()
      {
          //rotate = rotate_y(angleYaw).multiply(rotate_x(anglePitch))
          let rotate=(rotate_x(this.rotation.x)).multiply(rotate_y(this.rotation.y))
          this.To_defaultPos( )
          this.forward =this.forward.crossProduct(rotate)
          this.right=this.right.crossProduct(rotate)
          this.up =this.up.crossProduct(rotate)
      }
  matrix()
      {
         // this.update_axii()

         

          return this.translate_matrix().multiply(this.rotateY_matrix().multiply(rotate_x(this.rotation.x)))
      }
  translate_matrix()
      {
          let Cx = this.position.x
          let Cy = this.position.y
          let Cz= this.position.z
          

          return new Matrix([
              [1, 0, 0, 0],
              [0, 1, 0, 0],
              [0, 0, 1, 0],
              [-Cx, -Cy, -Cz, 1]
          ])             
         
         

      }
  rotateY_matrix(type="Float")
      {
          let s=Math.sin(this.rotation.y)
          let c=Math.cos (this.rotation.y)
          
          return new Matrix([
              [c, 0, -s, 0],
              [0, 1, 0, 0],
              [s, 0, c, 0],
              [0, 0, 0, 1]
          ])              
          
      }
  projectionMatrix(){
    return new Float32Array([
      2 / (this.right - this.left), 0, 0, 0,
      0, 2 / (this.bottom - this.top), 0, 0,
      0, 0, 2 / (this.near - this.far), 0,
 
      (this.left + this.right) / (this.left - this.right),
      (this.bottom + this.top) / (this.top - this.bottom),
      (this.near + this.far) / (this.near - this.far),1

    ])
  }

  
}