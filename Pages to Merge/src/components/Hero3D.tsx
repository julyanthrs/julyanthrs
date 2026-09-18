import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Color, Vector2, type Mesh, type ShaderMaterial } from 'three';
import { pointer } from '@/lib/pointer';
import { damp, lerp } from '@/lib/math';

const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uMorph;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisplacement;

${SIMPLEX_NOISE}

// Blob at rest; crystalline ridges and a twist as uMorph goes 0 -> 1.
vec3 displace(vec3 p, out float amount) {
  float slow = snoise(p * 1.2 + vec3(uTime * 0.18));
  float ridges = abs(snoise(p * 3.1 - vec3(uTime * 0.3)));
  amount = slow * 0.2 + ridges * 0.34 * uMorph;
  vec3 q = p * (1.0 + amount);
  float angle = q.y * uMorph * 1.4;
  float c = cos(angle);
  float s = sin(angle);
  q.xz = mat2(c, -s, s, c) * q.xz;
  return q;
}

void main() {
  vec3 base = normalize(position);
  float amount;
  vec3 displaced = displace(base, amount);

  // Recompute normals from neighbouring displaced points for correct reflections.
  vec3 tangent = normalize(cross(base, abs(base.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 bitangent = normalize(cross(base, tangent));
  float unused;
  float epsilon = 0.01;
  vec3 neighbourA = displace(normalize(base + tangent * epsilon), unused);
  vec3 neighbourB = displace(normalize(base + bitangent * epsilon), unused);
  vec3 displacedNormal = normalize(cross(neighbourA - displaced, neighbourB - displaced));

  vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * displacedNormal);
  vView = normalize(-viewPosition.xyz);
  vDisplacement = amount;
  gl_Position = projectionMatrix * viewPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uPointer;
uniform vec3 uHot;
uniform vec3 uSoft;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  if (!gl_FrontFacing) normal = -normal;
  vec3 view = normalize(vView);
  vec3 reflected = reflect(-view, normal);
  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.6);

  // Fake studio: a soft top light, a moving white strip and a pink horizon band.
  vec3 color = vec3(0.012);
  color += vec3(1.0) * pow(smoothstep(0.35, 1.0, reflected.y), 3.0) * 0.28;
  color += uSoft * smoothstep(0.05, 0.0, abs(reflected.x - 0.4 + sin(uTime * 0.35) * 0.12)) * 0.75;
  color += uHot * smoothstep(0.14, 0.0, abs(reflected.y + 0.2)) * 1.1;

  vec3 lightDirection = normalize(vec3(uPointer * 1.4, 1.2));
  vec3 halfVector = normalize(lightDirection + view);
  color += vec3(1.0, 0.86, 0.94) * pow(max(dot(normal, halfVector), 0.0), 80.0) * 1.3;

  color += uHot * fresnel * 1.25;
  color += uHot * smoothstep(0.25, 0.5, vDisplacement) * 0.18;
  gl_FragColor = vec4(color, 1.0);
}
`;

const AUTO_ROTATE_SPEED = 0.18;
const TILT_STRENGTH = 0.55;
const FOLLOW_SMOOTHING = 3.5;
const MORPH_SMOOTHING = 4;

interface BlobProps {
  morphRef: MutableRefObject<number>;
  segments: number;
  scale: number;
}

function Blob({ morphRef, segments, scale }: BlobProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const spin = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uHot: { value: new Color('#FF2D95') },
      uSoft: { value: new Color('#FFC1DC') },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const follow = damp(FOLLOW_SMOOTHING, delta);
    const uniformsRef = material.uniforms as typeof uniforms;

    spin.current += delta * AUTO_ROTATE_SPEED;
    mesh.rotation.y = lerp(mesh.rotation.y, spin.current + pointer.nx * TILT_STRENGTH, follow);
    mesh.rotation.x = lerp(mesh.rotation.x, pointer.ny * TILT_STRENGTH * 0.6, follow);

    uniformsRef.uTime.value = state.clock.elapsedTime;
    uniformsRef.uMorph.value = lerp(uniformsRef.uMorph.value, morphRef.current, damp(MORPH_SMOOTHING, delta));
    const pointerUniform = uniformsRef.uPointer.value;
    pointerUniform.set(lerp(pointerUniform.x, pointer.nx, follow), lerp(pointerUniform.y, -pointer.ny, follow));
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, segments, segments]} />
      <shaderMaterial ref={materialRef} uniforms={uniforms} vertexShader={VERTEX_SHADER} fragmentShader={FRAGMENT_SHADER} />
    </mesh>
  );
}

export interface Hero3DProps {
  morphRef: MutableRefObject<number>;
  lowPower: boolean;
  /** 'demand' renders a still frame (reduced motion); 'never' pauses offscreen. */
  frameloop: 'always' | 'demand' | 'never';
  compact: boolean;
}

const SEGMENTS = { high: 180, low: 96 };
const DPR = { high: 1.75, low: 1.1 };

export default function Hero3D({ morphRef, lowPower, frameloop, compact }: Hero3DProps) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop={frameloop}
      dpr={[1, lowPower ? DPR.low : DPR.high]}
      camera={{ position: [0, 0, 4.2], fov: 38 }}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}
    >
      <Blob morphRef={morphRef} segments={lowPower ? SEGMENTS.low : SEGMENTS.high} scale={compact ? 0.92 : 1.12} />
    </Canvas>
  );
}
