import { WorldCamera, vec3 } from "/Camera.js";

/**
 * Helper for Math & Matrix operations
 */
const MathUtils = {
    createRotationMatrix: (angle) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Float32Array([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    },
    createProjectionMatrix: (fov, aspect, near, far) => {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    },
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};

/**
 * Handles Shader compilation and location tracking
 */
class SigerShader {
    constructor(gl, vsSource, fsSource) {
        this.gl = gl;
        this.program = this._initShaderProgram(vsSource, fsSource);
        this.locations = {
            attributes: {
                position: gl.getAttribLocation(this.program, 'aVertexPosition'),
                normal: gl.getAttribLocation(this.program, 'aVertexNorm'),
                texcoord: gl.getAttribLocation(this.program, 'a_texcoord'),
            },
            uniforms: {
                projection: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                camTrans: gl.getUniformLocation(this.program, 'uCameraTransMatrix'),
                camRot: gl.getUniformLocation(this.program, 'uCameraRotMatrix'),
                lightDir: gl.getUniformLocation(this.program, 'uReverseLightDir'),
                modelIndex: gl.getUniformLocation(this.program, 'uModelIndex'),
                texture: gl.getUniformLocation(this.program, 'u_texture'),
            }
        };
    }

    _loadShader(type, source) {
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

    _initShaderProgram(vs, fs) {
        const vShader = this._loadShader(this.gl.VERTEX_SHADER, vs);
        const fShader = this._loadShader(this.gl.FRAGMENT_SHADER, fs);
        const prog = this.gl.createProgram();
        this.gl.attachShader(prog, vShader);
        this.gl.attachShader(prog, fShader);
        this.gl.linkProgram(prog);
        return prog;
    }
}

/**
 * The Core Engine
 */
class SigerEngine {
    constructor(canvasId, width, height) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        document.body.appendChild(this.canvas);

        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) throw new Error("WebGL2 not supported");

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.9, 1.0, 1.0);

        this.scene = { toRender: [] };
        this.ubo = null;
        this.modelsDataArray = new Float32Array(100 * 48); // Max 100 models
        this.frame = 0;
        this.rotationAngle = Math.PI / 4;
    }

    init(vs, fs, cameraPos) {
        this.shader = new SigerShader(this.gl, vs, fs);
        this.camera = new WorldCamera(this.canvas, cameraPos);
        
        // Setup UBO
        const blockIndex = this.gl.getUniformBlockIndex(this.shader.program, 'ModelBlock');
        this.gl.uniformBlockBinding(this.shader.program, blockIndex, 0);
        this.ubo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.ubo);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.modelsDataArray.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.ubo);
    }

    createGlobalVBO() {
        let totalSize = 0;
        this.scene.toRender.forEach(m => totalSize += m.vertices.length);

        const megaVerts = new Float32Array(totalSize);
        const megaTex = new Float32Array(totalSize);
        const megaNorm = new Float32Array(totalSize);
        let offset = 0;

        this.scene.toRender.forEach((m) => {
            megaVerts.set(m.vertices, offset);
            megaTex.set(m.texCoords, offset);
            megaNorm.set(m.normals, offset);
            m.startOffset = offset / 4;
            m.count = m.vertices.length / 4;
            offset += m.vertices.length;
        });

        const setupBuffer = (data, loc) => {
            const b = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, b);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
            this.gl.enableVertexAttribArray(loc);
            this.gl.vertexAttribPointer(loc, 4, this.gl.FLOAT, false, 0, 0);
            return b;
        };

        setupBuffer(megaVerts, this.shader.locations.attributes.position);
        setupBuffer(megaTex, this.shader.locations.attributes.texcoord);
        setupBuffer(megaNorm, this.shader.locations.attributes.normal);
    }

    updateUBO() {
        this.scene.toRender.forEach((m, i) => {
            const offset = i * 48;
            this.modelsDataArray.set(m.transposeMatrix.scaleMatrix, offset + 0);
            this.modelsDataArray.set(m.transposeMatrix.rotationMatrix, offset + 16);
            this.modelsDataArray.set(m.transposeMatrix.translateMatrix, offset + 32);
        });
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.ubo);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.modelsDataArray);
    }

    render() {
        this.frame++;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.shader.program);

        this.camera.control();
        const [viewTrans, viewRot] = this.camera.matrix();
        const proj = MathUtils.createProjectionMatrix(0.78, this.canvas.width/this.canvas.height, 0.1, 1000);

        // Set Globals
        this.gl.uniformMatrix4fv(this.shader.locations.uniforms.projection, false, proj);
        this.gl.uniformMatrix4fv(this.shader.locations.uniforms.camTrans, false, viewTrans);
        this.gl.uniformMatrix4fv(this.shader.locations.uniforms.camRot, false, viewRot);
        this.gl.uniform4fv(this.shader.locations.uniforms.lightDir, [0, 10, 5, 1]);

        this.updateUBO();

        let lastTexture = null;

        this.scene.toRender.forEach((m, i) => {
            // Culling logic
            const dist = Math.hypot(m.position.x - this.camera.position.x, m.position.z - this.camera.position.z);
            if (dist > 400) return;

            // Texture optimization
            if (lastTexture !== m.texture) {
                const tex = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, m.texture);
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
                lastTexture = m.texture;
            }

            this.gl.uniform1i(this.shader.locations.uniforms.modelIndex, i);
            this.gl.drawArrays(this.gl.TRIANGLES, m.startOffset, m.count);
        });

        requestAnimationFrame(() => this.render());
    }
}

// --- INITIALIZATION ---

const Engine = new SigerEngine("glCanvas", 720, 400);

// Setup your scene objects here (BuildingA, etc.)
// ... (Assuming Model data is loaded into scene.toRender) ...

Engine.init(vsSource, fsSource, [0, 0, -50]);
Engine.createGlobalVBO();
Engine.render();