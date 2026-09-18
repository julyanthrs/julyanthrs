import { Matrix4, Quaternion, Vector3 } from "three";
import { clamp, damp } from "@/lib/math";
import type { WingPose } from "./createButterflyModel";

export interface FlightConfig {
  /** Top speed in world units per second. */
  maxSpeed: number;
  /**
   * Maximum steering acceleration (units/s²); lower feels floatier. It also sets responsiveness:
   * velocity closes on the desired velocity at `steering / maxSpeed` per second.
   */
  steering: number;
  /** Distance at which the butterfly starts easing off toward its target. */
  arrivalRadius: number;
  /** How far the body rolls into turns. */
  bank: number;
  /** Orientation smoothing rate; higher follows the velocity more tightly. */
  turnRate: number;
  /** Keeps the body near horizontal when climbing or diving (0 is flat, 1 follows velocity). */
  pitchFollow: number;
  /** Wingbeat frequency range in Hz, cruising to full effort. */
  flapHz: readonly [number, number];
  /** Peak wing swing in radians. */
  flapAmplitude: number;
  /** Resting upward wing angle in radians. */
  dihedral: number;
  bobAmount: number;
  /** 0 disables gliding; 1 lets the butterfly glide freely when relaxed. */
  glideTendency: number;
}

export interface FlightState {
  position: Vector3;
  velocity: Vector3;
  /** Smoothed acceleration, which drives banking and wingbeat effort. */
  acceleration: Vector3;
  quaternion: Quaternion;
  flapPhase: number;
  /** 0 is relaxed, 1 is working hard (sharp turns, climbing). */
  effort: number;
  seed: number;
}

const WORLD_UP = new Vector3(0, 1, 0);
const MIN_ORIENT_SPEED = 0.04;
const EFFORT_RATE = 3;
const ACCELERATION_RATE = 6;
/** Skews the wing cycle so the downstroke is quicker than the upstroke. */
const STROKE_SKEW = 0.3;
/** Hindwings trail the forewings by this much of a cycle (radians). */
const HINDWING_LAG = 0.45;
/** Membrane flex: the outer wing lags the stroke by this phase and curls by up to this much. */
const BEND_LAG = 0.35;
// Secondary motion is normalised to the flap, so it is sized here for the calmer wingbeat.
const BEND_AMOUNT = 0.18;
const PITCH_AMOUNT = 0.07;
const ABDOMEN_SWING = 0.09;
const ANTENNA_SWAY = 0.08;
const TWIST_AMOUNT = 0.1;

// Scratch objects reused every frame to avoid garbage-collection hitches.
const toTarget = new Vector3();
const steer = new Vector3();
const forward = new Vector3();
const lateral = new Vector3();
const upHint = new Vector3();
const right = new Vector3();
const up = new Vector3();
const basis = new Matrix4();
const targetQuaternion = new Quaternion();

export const createFlightState = (position: Vector3, seed = 1): FlightState => ({
  position: position.clone(),
  velocity: new Vector3(),
  acceleration: new Vector3(),
  quaternion: new Quaternion(),
  flapPhase: 0,
  effort: 0,
  seed,
});

/** Advances position, velocity, orientation and wingbeat toward `target`. */
export const stepFlight = (state: FlightState, target: Vector3, delta: number, config: FlightConfig): void => {
  toTarget.subVectors(target, state.position);
  const distance = toTarget.length();
  const desiredSpeed = config.maxSpeed * Math.min(1, distance / config.arrivalRadius);
  if (distance > 1e-5) toTarget.multiplyScalar(desiredSpeed / distance);

  // Proportional steering: without the gain, velocity would crawl toward its target with a
  // fixed one-second time constant no matter how agile the config claims to be.
  steer.subVectors(toTarget, state.velocity).multiplyScalar(config.steering / config.maxSpeed);
  const steerLength = steer.length();
  if (steerLength > config.steering) steer.multiplyScalar(config.steering / steerLength);

  state.velocity.addScaledVector(steer, delta);
  state.position.addScaledVector(state.velocity, delta);
  state.acceleration.lerp(steer, damp(ACCELERATION_RATE, delta));

  const climb = Math.max(0, state.velocity.y) / config.maxSpeed;
  const targetEffort = clamp(state.acceleration.length() / config.steering + climb, 0, 1);
  state.effort += (targetEffort - state.effort) * damp(EFFORT_RATE, delta);

  const speed = state.velocity.length();
  if (speed > MIN_ORIENT_SPEED) {
    forward.copy(state.velocity);
    forward.y *= config.pitchFollow;
    forward.normalize();

    // Roll into the turn: tilt "up" toward the sideways part of the acceleration.
    lateral.copy(state.acceleration).addScaledVector(forward, -state.acceleration.dot(forward));
    upHint.copy(WORLD_UP).addScaledVector(lateral, config.bank);
    right.crossVectors(upHint, forward).normalize();
    up.crossVectors(forward, right);
    basis.makeBasis(right, up, forward);
    targetQuaternion.setFromRotationMatrix(basis);
    state.quaternion.slerp(targetQuaternion, damp(config.turnRate, delta));
  }

  const [calmHz, busyHz] = config.flapHz;
  state.flapPhase += delta * Math.PI * 2 * (calmHz + (busyHz - calmHz) * state.effort);
};

const stroke = (phase: number): number => Math.sin(phase + STROKE_SKEW * Math.sin(phase));

/** Wing pose for the current wingbeat, with occasional glides when the butterfly is relaxed. */
export const computeWingPose = (state: FlightState, elapsed: number, config: FlightConfig, out: WingPose): WingPose => {
  const glideWave = 0.5 + 0.5 * Math.sin(elapsed * 0.31 + state.seed * 7.3);
  const glide = clamp((glideWave - 0.72) / 0.2, 0, 1) * (1 - state.effort) * config.glideTendency;
  const amplitude = config.flapAmplitude * (1 - glide * 0.7);
  const downstroke = stroke(state.flapPhase);

  out.fore = config.dihedral + amplitude * downstroke;
  out.hind = config.dihedral * 0.8 + amplitude * 0.88 * stroke(state.flapPhase - HINDWING_LAG);
  const strength = amplitude / config.flapAmplitude;
  out.twist = TWIST_AMOUNT * strength * Math.cos(state.flapPhase);
  // Wing velocity leads its angle by a quarter cycle; the membrane curls against that motion, a little late.
  out.bend = -BEND_AMOUNT * strength * Math.cos(state.flapPhase - BEND_LAG);
  out.bob = -config.bobAmount * strength * downstroke;
  out.pitch = PITCH_AMOUNT * strength * Math.cos(state.flapPhase) - 0.1 * state.effort;
  out.abdomen = ABDOMEN_SWING * strength * Math.sin(state.flapPhase + 1.2);
  out.antenna = ANTENNA_SWAY * Math.sin(state.flapPhase * 0.5 + 0.8) + 0.05 * Math.sin(elapsed * 1.3 + state.seed);
  return out;
};

/** Blends two flight configs, so behaviour changes (follow ↔ roam) never snap. Writes into `out`. */
export const mixFlightConfig = (from: FlightConfig, to: FlightConfig, weight: number, out: FlightConfig): FlightConfig => {
  const mix = (a: number, b: number) => a + (b - a) * weight;
  out.maxSpeed = mix(from.maxSpeed, to.maxSpeed);
  out.steering = mix(from.steering, to.steering);
  out.arrivalRadius = mix(from.arrivalRadius, to.arrivalRadius);
  out.bank = mix(from.bank, to.bank);
  out.turnRate = mix(from.turnRate, to.turnRate);
  out.pitchFollow = mix(from.pitchFollow, to.pitchFollow);
  out.flapHz = [mix(from.flapHz[0], to.flapHz[0]), mix(from.flapHz[1], to.flapHz[1])];
  out.flapAmplitude = mix(from.flapAmplitude, to.flapAmplitude);
  out.dihedral = mix(from.dihedral, to.dihedral);
  out.bobAmount = mix(from.bobAmount, to.bobAmount);
  out.glideTendency = mix(from.glideTendency, to.glideTendency);
  return out;
};

export const createWingPose = (): WingPose => ({ fore: 0, hind: 0, twist: 0, bend: 0, bob: 0, pitch: 0, abdomen: 0, antenna: 0 });

/** Smooth, non-repeating-looking drift built from incommensurate sine waves. */
export const wander = (elapsed: number, seed: number, out: Vector3): Vector3 =>
  out.set(
    Math.sin(elapsed * 0.43 + seed) * 0.6 + Math.sin(elapsed * 1.17 + seed * 2.1) * 0.25,
    Math.sin(elapsed * 0.61 + seed * 1.7) * 0.5 + Math.sin(elapsed * 1.53 + seed * 0.4) * 0.2,
    Math.sin(elapsed * 0.37 + seed * 3.1) * 0.5 + Math.sin(elapsed * 0.97 + seed * 1.3) * 0.2,
  );
