import {Matrix} from "./Matrix.js"
export function Translate(pos) {
    
  return new Matrix(
          [
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [pos.x,pos.y,pos.z,1]
          ]
  )
    
}
export function Scale (size) {
  let ScaleMatrix=
  [
    [size.x,0,0,0],
    [0,size.y,0,0],
    [0,0,size.z,0],
    [0,0,0,1]
    
    
  ]
  return new Matrix(ScaleMatrix)
}
export function rotate_y(angle){
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    // Create a 3x3 rotation matrix for 2D rotation
    // We use a Float32Array to send it efficiently to the GPU
    return new Matrix([
        [c, 0, -s, 0],
        [0, 1, 0, 0],
        [s, 0, c, 0],
        [0, 0, 0, 1]
    ]);
}

export function rotate_z(a){
    return Matrix([
        [Math.cos(a), Math.sin(a), 0, 0],
        [-Math.sin(a), Math.cos(a), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ])

}

export function rotate_x(a){
    return Matrix([
        [1, 0, 0, 0],
        [0, Math.cos(a), Math.sin(a), 0],
        [0, -Math.sin(a), Math.cos(a), 0],
        [0, 0, 0, 1]
    ])
}
export var TransformMatrixes={
    getTranslateMatrix:function (tx,ty,tz) {
          return new Float32Array(
          [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            tx,ty,tz,1
          ])
    
    },
    
    getScaleMatrix:function  (S) {
          const ScaleMatrix=
          [
            S.x,0,0,0,
            0,S.y,0,0,
            0,0,S.z,0,
            0,0,0,1
            
            
          ]
          return new Float32Array(ScaleMatrix)
    },
    
    getRotateXMatrix:function (angle)
    {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            
            // Create a 3x3 rotation matrix for 2D rotation
            // We use a Float32Array to send it efficiently to the GPU
            return new Float32Array([
                    1, 0, 0, 0,
                    0, c, s, 0,
                    0, -s, c, 0,
                    0, 0, 0, 1
            ]);
    },
    getRotateYMatrix:function (angle)
    {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            
            // Create a 3x3 rotation matrix for 2D rotation
            // We use a Float32Array to send it efficiently to the GPU
            return new Float32Array([
                c, 0, -s, 0,
                0, 1, 0, 0,
                s, 0, c, 0,
                0, 0, 0, 1
            ]);
    },
    getRotateZMatrix:function (angle)
    {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            
            // Create a 3x3 rotation matrix for 2D rotation
            // We use a Float32Array to send it efficiently to the GPU
            return new Float32Array([
                c, s, 0, 0,
                -s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);
    },
}