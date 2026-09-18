import { gsap } from 'gsap';
import { MEDIA } from './motion';

const SPARK_COUNT = 9;
const SPARK_COLORS = ['#FF2D95', '#FF4FA3', '#FF9FCC', '#FFC1DC'];
const SPARK_DISTANCE = { min: 26, max: 70 };

let layer: HTMLDivElement | null = null;

const getLayer = (): HTMLDivElement => {
  if (layer && document.body.contains(layer)) return layer;
  layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:95;overflow:hidden;';
  document.body.appendChild(layer);
  return layer;
};

/** Small pink particles for click feedback. Pure transform/opacity, self-cleaning. */
export const emitSparks = (x: number, y: number, count = SPARK_COUNT): void => {
  if (typeof window === 'undefined' || window.matchMedia(MEDIA.reducedMotion).matches) return;
  if (x === 0 && y === 0) return; // keyboard-triggered clicks report 0,0
  const container = getLayer();

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement('span');
    const size = 3 + Math.random() * 5;
    spark.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:9999px;background:${SPARK_COLORS[index % SPARK_COLORS.length]};`;
    container.appendChild(spark);

    const angle = (index / count) * Math.PI * 2 + Math.random() * 0.6;
    const distance = SPARK_DISTANCE.min + Math.random() * (SPARK_DISTANCE.max - SPARK_DISTANCE.min);
    gsap.fromTo(
      spark,
      { x: -size / 2, y: -size / 2, scale: 1, opacity: 1 },
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0,
        opacity: 0,
        duration: 0.7 + Math.random() * 0.3,
        ease: 'expo.out',
        onComplete: () => spark.remove(),
      },
    );
  }
};
