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
    applyQuaternion(q) {
        if (q.type !== "SigerQuaternion") throw new Error("Siger error: Argument must be SigerQuaternion");
        const qVec = new Vector3([q.x, q.y, q.z]);
        const uv = qVec.crossProduct(this);
        const uuv = qVec.crossProduct(uv);
        uv.multiplyInt(2 * q.w);
        uuv.multiplyInt(2);
        return this.plus(uv).plus(uuv);
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
