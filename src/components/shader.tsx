"use client";

import { useEffect, useRef } from "react";

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.03 + vec2(3.7, 8.2);
    a *= 0.5;
  }
  return v;
}

vec2 gradAt(vec2 pos) {
  float e = 0.02;
  float dx = fbm(pos + vec2(e, 0.0)) - fbm(pos - vec2(e, 0.0));
  float dy = fbm(pos + vec2(0.0, e)) - fbm(pos - vec2(0.0, e));
  return vec2(dx, dy) / (2.0 * e);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 aspect = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float t = u_time * 0.55;
  vec2 m = (u_mouse - 0.5) * 0.55;

  vec2 drift = vec2(0.0, -t * 0.055);
  vec2 q = p * 1.25 + m + drift;

  float wa = fbm(q * 1.3 + vec2(0.0, t * 0.03));
  float wb = fbm(q * 1.3 + vec2(5.2, t * 0.03));
  vec2 warp = q + 1.15 * vec2(wa, wb);
  float f = fbm(warp * 1.2);

  vec3 base = vec3(0.05, 0.055, 0.068);
  vec3 accent = vec3(0.48, 0.52, 0.98);
  vec3 ice = vec3(0.72, 0.78, 1.0);

  vec3 col = base;

  float bloom = smoothstep(1.15, 0.0, length(p - vec2(0.0, 0.22)));
  col += vec3(0.36, 0.40, 0.85) * bloom * 0.28;

  float l1 = pow(0.5 + 0.5 * sin(f * 20.0 - t * 0.35), 5.0);
  float l2 = pow(0.5 + 0.5 * sin(wb * 30.0 + t * 0.45 + q.x * 2.6), 7.0);
  col += accent * l1 * 0.30;
  col += ice * l2 * 0.10;

  vec2 lanes = vec2(16.0, 10.0);
  vec2 cell = floor(p * lanes);
  float seed = hash(cell);
  float act = smoothstep(0.78, 0.92, seed);
  if (act > 0.0) {
    vec2 c = (cell + 0.5) / lanes;
    vec2 g = gradAt(c + drift * 1.4);
    vec2 flowDir = dot(g, g) > 1e-6 ? normalize(vec2(-g.y, g.x)) : vec2(1.0, 0.0);
    float speed = 0.10 + seed * 0.22;
    float phase = hash(cell + vec2(11.7, 3.3));
    float along = fract(phase + t * speed);
    vec2 mote = c + flowDir * (along - 0.5) * 0.9;
    vec2 d = mote - p;
    float core = exp(-dot(d, d) * 42.0);
    vec2 dt = d - flowDir * 0.07;
    float tail = exp(-dot(dt, dt) * 22.0);
    col += ice * act * (core * 0.85 + tail * 0.28);
  }

  float vin = smoothstep(0.92, 0.30, length(p * vec2(1.0, 0.85)));
  col *= mix(0.70, 1.0, vin);

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

export function ShaderField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let raf = 0;
    let running = true;
    const start = performance.now();
    let mouse = { x: 0.5, y: 0.5 };
    let target = { x: 0.5, y: 0.5 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const draw = (now: number) => {
      if (!running) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target = { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
    };

    if (reduce) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, 6.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(draw);
    }

    canvas.addEventListener("pointermove", onPointer);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onPointer);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
