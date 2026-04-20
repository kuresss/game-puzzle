import vertSrc from './shaders/vert.glsl';
import renderSrc from './shaders/render.glsl';

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private quadVAO: WebGLVertexArrayObject;
  private targetTexture: WebGLTexture | null = null;
  targetAlpha = 0.25;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = this.compileProgram(vertSrc, renderSrc);
    this.quadVAO = this.createQuad();
  }

  setTargetTexture(tex: WebGLTexture) {
    this.targetTexture = tex;
  }

  render(dyeTexture: WebGLTexture, canvasWidth: number, canvasHeight: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dyeTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_dye'), 0);

    if (this.targetTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
      gl.uniform1i(gl.getUniformLocation(this.program, 'u_target'), 1);
      gl.uniform1f(gl.getUniformLocation(this.program, 'u_targetAlpha'), this.targetAlpha);
    } else {
      gl.uniform1f(gl.getUniformLocation(this.program, 'u_targetAlpha'), 0.0);
    }

    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      throw new Error('Render shader link: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Render shader compile: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }
}
