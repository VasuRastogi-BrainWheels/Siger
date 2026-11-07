import * as sg from "./Scripts/siger.js"
import * as obj from "./Scripts/Object3d.js"
import * as cam from "./Scripts/Camera.js"
import {Vector3} from "./Scripts/Vector.js"
export class Siger{
    constructor(){
        this.SigerEngine=sg.SigerEngine
        this.SigerWorld=sg.SigerWorld
        this.PerspectiveCamera=cam.PerspectiveCamera
        this.OrthographicCamera=cam.OrthographicCamera
        this.SimpleGridMap=sg.SimpleGridMap
        this.Fog=sg.Fog

        this.Geometry3D=obj.Geometry3D
        this.Object3D=obj.Object3D
        this.RigidBody3D=obj.RigidBody3D
        this.VehicleBody3D=obj.VehicleBody3D
        this.BoundingBox=obj.BoundingBox
        this.Vector3=Vector3


    }

}



