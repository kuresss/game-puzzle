import vertSrc from './shaders/vert.glsl';
import scoreSrc from './shaders/score.glsl';

export class ScoreEngine {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private scoreFBO: WebGLFramebuffer;
  private scoreTexture: WebGLTexture;
  private quadVAO: WebGLVertexArrayObject;
  private scoreSize = 64;
  private targetTexture: WebGLTexture | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = this.compileProgram(vertSrc, scoreSrc);
    this.quadVAO = this.createQuad();

    this.scoreTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.scoreTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, this.scoreSize, this.scoreSize, 0, gl.RED, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this.scoreFBO = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scoreFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.scoreTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  setTarget(tex: WebGLTexture) {
    this.targetTexture = tex;
  }

  compute(dyeTexture: WebGLTexture): number {
    if (!this.targetTexture) return 0;
    const gl = this.gl;
    const size = this.scoreSize;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scoreFBO);
    gl.viewport(0, 0, size, size);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dyeTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_current'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_target'), 1);

    gl.uniform2f(gl.getUniformLocation(this.program, 'u_texelSize'), 1 / size, 1 / size);

    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // CPU readback
    const pixels = new Float32Array(size * size);
    gl.readPixels(0, 0, size, size, gl.RED, gl.FLOAT, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // MSE → similarity (0~1)
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) sum += pixels[i];
    const mse = sum / pixels.length;
    // mse=0 → perfect match (1.0), mse grows → lower score
    return Math.max(0, 1.0 - Math.sqrt(mse));
  }

  private createQuad(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    const buf = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
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
      throw new Error('Score shader link: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Score shader compile: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }
}
