export class Vector3{
    /**
        * @param {number[]} vec - An array of three numbers representing the vector [x, y, z].
    */
    constructor(vec = [0, 0, 0]) {
        this.type = "SigerVector3";
        this.x = vec[0];
        this.y = vec[1];
        this.z = vec[2];
    }

  // In-Place
  /**
        * Adds another Vector3 to this vector in place.
        * @param {Vector3} other - Another Vector3 instance.
        * @returns {Vector3} This vector after addition.
    */
    add(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }
    /**
        * @returns {number} The magnitude of vector
    */
    magnitude(){
        return Math.sqrt(this.x**2+this.y**2+this.z**2)
    }
    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

  // Returns New Instance
    /**
        * @param {Vector3} other - Another Vector3 instance.
        * @returns {Vector3} A new Vector3 instance representing the sum of this vector and the other vector.
    */
    plus(other) {
        return new Vector3([this.x + other.x, this.y + other.y, this.z + other.z]);
    }
    /**
        * @param {Vector3} other - Another Vector3 instance.
        * @returns {Vector3} A new Vector3 instance representing the difference between this vector and the other vector.
    */

    minus(other) {
        return new Vector3([this.x - other.x, this.y - other.y, this.z - other.z]);
    }

    multiplyInt(int) {
        return new Vector3([this.x * int, this.y * int, this.z * int]);
    }

    // ==================== VECTOR MATH ====================
    dotProduct(v2) {
        if (v2.type !== "SigerVector3") throw new Error("Siger error: Argument must be SigerVector3");
        return (this.x * v2.x) + (this.y * v2.y) + (this.z * v2.z);
    }
    /**
       * @param {Vector3} v2 - Second vector 
       * @returns {Vector3} The cross vector 
    */
    crossProduct(v2) {
        if (v2.type !== "SigerVector3") throw new Error("Siger error: Argument must be SigerVector3");
        return new Vector3([
            this.y * v2.z - this.z * v2.y,
            this.z * v2.x - this.x * v2.z,
            this.x * v2.y - this.y * v2.x
        ]);
    }
    /**
        * Normalizes the vector to have a magnitude of 1.
        * @returns {Vector3} A new Vector3 instance representing the normalized vector.
    */
    normalize() {
        const magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (magnitude === 0) return new Vector3([0, 0, 0]);
        return new Vector3([this.x / magnitude, this.y / magnitude, this.z / magnitude]);
    }

    distanceTo(v2) {
        if (v2.type !== "SigerVector3") throw new Error("Siger error: Argument must be SigerVector3");
        const dx = this.x - v2.x;
        const dy = this.y - v2.y;
        let dz = v2.z !== undefined ? this.z - v2.z : this.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // ==================== UTILITIES ====================
    copy() {
        return new Vector3([this.x, this.y, this.z]);
    }

    isOrigin() {
        return !(this.x + this.y + this.z);
    }

    equalTo(vec) {
        return this.x === vec.x && this.y === vec.y && this.z === vec.z;
    }
    /**
        * @returns {number} angle between the vectors measured clockwise
    */
    angleWith(v2){
        let dot=this.dotProduct(v2)
        const mA=this.magnitude()
        const mB=v2.magnitude()
        return !Number.isNaN( Math.acos(dot/(mA*mB)))?Math.acos(dot/(mA*mB)):0

    }
    applyQuaternion(q) {
        if (q.type !== "SigerQuaternion") throw new Error("Siger error: Argument must be SigerQuaternion");
        const qVec = new Vector3([q.x, q.y, q.z]);
        let uv = qVec.crossProduct(this);
        let uuv = qVec.crossProduct(uv);
        uv=uv.multiplyInt(2 * q.w);
        uuv=uuv.multiplyInt(2);
        return this.plus(uv).plus(uuv);
    }
    
}
export class Vector2 {
    /**
* @param {number[]} vec - An array of two numbers representing the vector [x, y].
    */
    constructor(vec = [0, 0]) {
        this.type = "SigerVector2";
        this.x = vec[0] ?? 0;
        this.y = vec[1] ?? 0;
    }

    // In-Place
    /**
* Adds another Vector2 to this vector in place.
* @param {Vector2} other - Another Vector2 instance.
* @returns {Vector2} This vector after addition.
    */
    add(other) {
        if (other.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    /**
* @returns {number} The magnitude of vector
    */
    magnitude() {
        return Math.hypot(this.x, this.y);
    }
    /**
* Subtracts another Vector2 from this vector in place.
* @param {Vector2} other - Another Vector2 instance.
* @returns {Vector2} This vector after subtraction.
    */
    subtract(other) {
        if (other.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    /**
* Scales this vector by a scalar in place.
* @param {number} scalar - Number to multiply each component by.
* @returns {Vector2} This vector after scaling.
    */
    scaleInPlace(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    // Returns New Instance
    /**
* @param {Vector2} other - Another Vector2 instance.
* @returns {Vector2} A new Vector2 instance representing the sum of this vector and the other vector.
    */
    plus(other) {
        if (other.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return new Vector2([this.x + other.x, this.y + other.y]);
    }
    /**
* @param {Vector2} other - Another Vector2 instance.
* @returns {Vector2} A new Vector2 instance representing the difference between this vector and the other vector.
    */
    minus(other) {
        if (other.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return new Vector2([this.x - other.x, this.y - other.y]);
    }
    /**
* @param {number} int - Scalar value to multiply the vector by.
* @returns {Vector2} A new Vector2 instance scaled by the given value.
    */
    multiplyInt(int) {
        return new Vector2([this.x * int, this.y * int]);
    }

    
    /**
* @param {Vector2} v2 - Second vector
* @returns {number} Dot product of the two vectors
    */
    dotProduct(v2) {
        if (v2.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return (this.x * v2.x) + (this.y * v2.y);
    }
    /**
* @param {Vector2} v2 - Second vector
* @returns {number} 2D cross product (scalar determinant) of the two vectors
    */
    crossProduct(v2) {
        if (v2.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return (this.x * v2.y) - (this.y * v2.x);
    }
    /**
* Normalizes the vector to have a magnitude of 1.
* @returns {Vector2} A new Vector2 instance representing the normalized vector.
    */
    normalize() {
        const magnitude = Math.hypot(this.x, this.y);
        if (magnitude === 0) return new Vector2([0, 0]);
        return new Vector2([this.x / magnitude, this.y / magnitude]);
    }
    /**
* Rotates the vector by a given angle in radians.
* @param {number} radians - Angle in radians.
* @returns {Vector2} A new rotated Vector2 instance.
    */
    rotate(radians) {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return new Vector2([
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        ]);
    }
    /**
* @param {Vector2} v2 - Target vector
* @returns {number} Euclidean distance to the other vector
    */
    distanceTo(v2) {
        if (v2.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return Math.hypot(this.x - v2.x, this.y - v2.y);
    }
    /**
* @param {Vector2} v2 - Second vector
* @returns {number} Unsigned angle between the vectors in radians
    */
    angleWith(v2) {
        if (v2.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        const denom = this.magnitude() * v2.magnitude();
        if (denom === 0) return 0;
        const cosTheta = Math.max(-1, Math.min(1, this.dotProduct(v2) / denom));
        return Math.acos(cosTheta);
    }
    /**
* @param {Vector2} v2 - Second vector
* @returns {number} Signed angle from this vector to v2 in radians
    */
    signedAngleWith(v2) {
        if (v2.type !== "SigerVector2") throw new Error("Siger error: Argument must be SigerVector2");
        return Math.atan2(this.crossProduct(v2), this.dotProduct(v2));
    }

    // ==================== UTILITIES ====================
    /**
* @returns {Vector2} A new Vector2 copy with identical components.
    */
    copy() {
        return new Vector2([this.x, this.y]);
    }
    /**
* @returns {boolean} True if both x and y are zero.
    */
    isOrigin() {
        return !(this.x + this.y);
    }
    /**
* @param {Vector2} vec - Vector to compare against.
* @returns {boolean} True if x and y match.
    */
    equalTo(vec) {
        return this.x === vec.x && this.y === vec.y;
    }
   /**
* @param {Vector3} vec - Vector to make new vector from.
* @param {string} plane- Which axis to keep.
    */
    
    static fromVector3(vec,plane){
        let data=[]
        if(!["xz","xy","yz"].includes(plane)) throw new Error(`Siger Error: Invalid plane passed to Vector2.fromVector3.\nExpected one of these:["xz","xy","yz"].Got:${plane}`)
        for( let axis of plane ){
            data.push(vec[axis])
        }
        return new Vector2(data)
    }
}
class Quaternion {
    constructor(w = 1, x = 0, y = 0, z = 0) {
        this.type = "SigerQuaternion";
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    multiply(q2) {
        if (q2.type !== "SigerQuaternion") throw new Error("Siger error: Argument must be SigerQuaternion");
        return new Quaternion(
            this.w * q2.w - this.x * q2.x - this.y * q2.y - this.z * q2.z,
            this.w * q2.x + this.x * q2.w + this.y * q2.z - this.z * q2.y,
            this.w * q2.y - this.x * q2.z + this.y * q2.w + this.z * q2.x,
            this.w * q2.z + this.x * q2.y - this.y * q2.x + this.z * q2.w
        );
    }

}
class EularRotation {
    constructor(x = 0, y = 0, z = 0) {
        this.type = "SigerEularRotation";
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toQuaternion() {
        const c1 = Math.cos(this.y / 2);
        const c2 = Math.cos(this.x / 2);
        const c3 = Math.cos(this.z / 2);
        const s1 = Math.sin(this.y / 2);
        const s2 = Math.sin(this.x / 2);
        const s3 = Math.sin(this.z / 2);

        return new Quaternion(
            c1 * c2 * c3 + s1 * s2 * s3,
            s1 * c2 * c3 - c1 * s2 * s3,
            c1 * s2 * c3 + s1 * c2 * s3,
            c1 * c2 * s3 - s1 * s2 * c3
        );
    }
}
//
let a=new Vector3([2,0,28])
console.log(a.angleWith(new Vector3([27,0,28]))*180/Math.PI)