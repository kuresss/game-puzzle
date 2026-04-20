import vertSrc from './shaders/vert.glsl';
import advectSrc from './shaders/advect.glsl';
import divergenceSrc from './shaders/divergence.glsl';
import jacobiSrc from './shaders/jacobi.glsl';
import gradsubtSrc from './shaders/gradsubt.glsl';
import splatSrc from './shaders/splat.glsl';
import dyeSplatSrc from './shaders/dye_splat.glsl';
import curlSrc from './shaders/curl.glsl';
import vorticitySrc from './shaders/vorticity.glsl';

export type PerformanceTier = 'desktop' | 'high' | 'mid' | 'low';

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap(): void;
}

interface SplatColor {
  pH: number;
  temp: number;
  density: number;
}

export function detectPerformanceTier(gl: WebGL2RenderingContext): PerformanceTier {
  const renderer = gl.getParameter(gl.RENDERER) as string;
  const isMobile = /Mali|Adreno|PowerVR|Apple GPU/i.test(renderer);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (!isMobile) return 'desktop';
  if (maxTex >= 8192) return 'high';
  if (maxTex >= 4096) return 'mid';
  return 'low';
}

const TIER_CONFIG: Record<PerformanceTier, { simSize: number; jacobiIter: number }> = {
  desktop: { simSize: 256, jacobiIter: 20 },
  high:    { simSize: 192, jacobiIter: 16 },
  mid:     { simSize: 128, jacobiIter: 12 },
  low:     { simSize: 96,  jacobiIter: 10 },
};

export class FluidSim {
  private gl: WebGL2RenderingContext;
  private simSize: number;
  private jacobiIter: number;
  private quadVAO: WebGLVertexArrayObject;

  private velocity: DoubleFBO;
  private dye: DoubleFBO;
  private pressure: DoubleFBO;
  private divergenceFBO: FBO;
  private curlFBO: FBO;

  private programs: {
    advect:    WebGLProgram;
    divergence:WebGLProgram;
    jacobi:    WebGLProgram;
    gradsubt:  WebGLProgram;
    splat:     WebGLProgram;
    dyeSplat:  WebGLProgram;
    curl:      WebGLProgram;
    vorticity: WebGLProgram;
  };

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const tier = detectPerformanceTier(gl);
    const cfg = TIER_CONFIG[tier];
    this.simSize = cfg.simSize;
    this.jacobiIter = cfg.jacobiIter;

    this.quadVAO = this.createQuad();
    this.programs = this.compilePrograms();

    this.velocity   = this.createDoubleFBO(this.simSize, this.simSize, gl.RG32F, gl.RG, gl.FLOAT);
    this.dye        = this.createDoubleFBO(this.simSize, this.simSize, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    this.pressure   = this.createDoubleFBO(this.simSize, this.simSize, gl.R32F, gl.RED, gl.FLOAT);
    this.divergenceFBO = this.createFBO(this.simSize, this.simSize, gl.R32F, gl.RED, gl.FLOAT);
    this.curlFBO    = this.createFBO(this.simSize, this.simSize, gl.R32F, gl.RED, gl.FLOAT);
  }

  step(dt: number) {
    const gl = this.gl;
    gl.disable(gl.BLEND);

    // Curl
    this.runPass(this.programs.curl, this.curlFBO.fbo, {
      u_velocity: [this.velocity.read.texture, 0],
      u_texelSize: [1 / this.simSize, 1 / this.simSize],
    });

    // Vorticity confinement
    this.runPass(this.programs.vorticity, this.velocity.write.fbo, {
      u_velocity: [this.velocity.read.texture, 0],
      u_curl:     [this.curlFBO.texture, 1],
      u_texelSize: [1 / this.simSize, 1 / this.simSize],
      u_curl_strength: 20.0,
      u_dt: dt,
    });
    this.velocity.swap();

    // Advect velocity
    this.runPass(this.programs.advect, this.velocity.write.fbo, {
      u_velocity:    [this.velocity.read.texture, 0],
      u_source:      [this.velocity.read.texture, 0],
      u_dt:          dt,
      u_texelSize:   [1 / this.simSize, 1 / this.simSize],
      u_dissipation: 0.99,
    });
    this.velocity.swap();

    // Advect dye
    this.runPass(this.programs.advect, this.dye.write.fbo, {
      u_velocity:    [this.velocity.read.texture, 0],
      u_source:      [this.dye.read.texture, 1],
      u_dt:          dt,
      u_texelSize:   [1 / this.simSize, 1 / this.simSize],
      u_dissipation: 0.995,
    });
    this.dye.swap();

    // Divergence
    this.runPass(this.programs.divergence, this.divergenceFBO.fbo, {
      u_velocity:  [this.velocity.read.texture, 0],
      u_texelSize: [1 / this.simSize, 1 / this.simSize],
    });

    // Clear pressure
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.read.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Jacobi pressure solve
    for (let i = 0; i < this.jacobiIter; i++) {
      this.runPass(this.programs.jacobi, this.pressure.write.fbo, {
        u_pressure:   [this.pressure.read.texture, 0],
        u_divergence: [this.divergenceFBO.texture, 1],
        u_texelSize:  [1 / this.simSize, 1 / this.simSize],
      });
      this.pressure.swap();
    }

    // Gradient subtract
    this.runPass(this.programs.gradsubt, this.velocity.write.fbo, {
      u_pressure:  [this.pressure.read.texture, 0],
      u_velocity:  [this.velocity.read.texture, 1],
      u_texelSize: [1 / this.simSize, 1 / this.simSize],
    });
    this.velocity.swap();
  }

  splat(x: number, y: number, vx: number, vy: number, color: SplatColor, radius = 0.003) {
    const aspect = 1.0; // square sim grid

    // Velocity splat
    this.runPass(this.programs.splat, this.velocity.write.fbo, {
      u_target:      [this.velocity.read.texture, 0],
      u_point:       [x, y],
      u_velocity:    [vx, vy],
      u_color:       [0, 0, 0, 0],
      u_radius:      radius,
      u_aspectRatio: aspect,
    });
    this.velocity.swap();

    // Dye splat
    this.runPass(this.programs.dyeSplat, this.dye.write.fbo, {
      u_target:      [this.dye.read.texture, 0],
      u_point:       [x, y],
      u_color:       [color.pH, color.temp, 0, color.density],
      u_radius:      radius * 2.0,
      u_aspectRatio: aspect,
    });
    this.dye.swap();
  }

  getDyeTexture(): WebGLTexture {
    return this.dye.read.texture;
  }

  getSimSize(): number {
    return this.simSize;
  }

  // ---- Private helpers ----

  private runPass(
    program: WebGLProgram,
    targetFBO: WebGLFramebuffer | null,
    uniforms: Record<string, number | number[] | [WebGLTexture, number]>
  ) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO);
    gl.viewport(0, 0, this.simSize, this.simSize);
    gl.useProgram(program);
    this.setUniforms(program, uniforms);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private setUniforms(
    program: WebGLProgram,
    uniforms: Record<string, number | number[] | [WebGLTexture, number]>
  ) {
    const gl = this.gl;
    for (const [name, value] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      if (loc === null) continue;

      if (Array.isArray(value) && value[0] instanceof WebGLTexture) {
        const [tex, unit] = value as [WebGLTexture, number];
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(loc, unit);
      } else if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value as number[]);
        else if (value.length === 3) gl.uniform3fv(loc, value as number[]);
        else if (value.length === 4) gl.uniform4fv(loc, value as number[]);
      } else {
        gl.uniform1f(loc, value as number);
      }
    }
  }

  private createQuad(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    const buf = gl.createBuffer()!;
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  }

  private compilePrograms() {
    return {
      advect:     this.compileProgram(vertSrc, advectSrc),
      divergence: this.compileProgram(vertSrc, divergenceSrc),
      jacobi:     this.compileProgram(vertSrc, jacobiSrc),
      gradsubt:   this.compileProgram(vertSrc, gradsubtSrc),
      splat:      this.compileProgram(vertSrc, splatSrc),
      dyeSplat:   this.compileProgram(vertSrc, dyeSplatSrc),
      curl:       this.compileProgram(vertSrc, curlSrc),
      vorticity:  this.compileProgram(vertSrc, vorticitySrc),
    };
  }

  private compileProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const gl = this.gl;
    const vert = this.compileShader(gl.VERTEX_SHADER, vertSrc);
    const frag = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.bindAttribLocation(prog, 0, 'a_position');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Shader link error: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  private createFBO(
    w: number, h: number,
    internalFormat: number, format: number, type: number
  ): FBO {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, fbo };
  }

  private createDoubleFBO(
    w: number, h: number,
    internalFormat: number, format: number, type: number
  ): DoubleFBO {
    let a = this.createFBO(w, h, internalFormat, format, type);
    let b = this.createFBO(w, h, internalFormat, format, type);
    return {
      get read() { return a; },
      get write() { return b; },
      swap() { [a, b] = [b, a]; },
    };
  }
}
