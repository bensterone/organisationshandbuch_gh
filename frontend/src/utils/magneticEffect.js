/**
 * Idempotent magnetic hover effect utilities.
 * Usage:
 *   import { enableMagneticEffect, disableMagneticEffect, attachMagnetic } from "@/utils/magneticEffect";
 *   enableMagneticEffect(); // binds to .magnetic-link, .magnetic-button, .magnetic-nav (once)
 */

let isEnabled = false;
const bound = new WeakMap(); // el -> { onMove, onLeave }

/**
 * Attach the effect to a single element.
 * Options:
 *  - strength: how far to translate relative to mouse (px) [default 12]
 *  - ease: CSS transition duration for snap-back [default "120ms"]
 */
export function attachMagnetic(el, options = {}) {
  if (!el || bound.has(el)) return;

  const strength = Number(options.strength ?? 12);
  const ease = String(options.ease ?? "120ms");

  const rectOf = () => el.getBoundingClientRect();
  const glow = el.querySelector?.(".magnetic-glow");

  const onMove = (e) => {
    const r = rectOf();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const ratioX = Math.max(-1, Math.min(1, dx / (r.width / 2)));
    const ratioY = Math.max(-1, Math.min(1, dy / (r.height / 2)));

    el.style.willChange = "transform";
    el.style.transition = "transform 40ms linear";
    el.style.transform = `translate(${ratioX * strength}px, ${ratioY * strength}px)`;

    if (glow) {
      glow.style.willChange = "transform, opacity";
      glow.style.transition = "transform 40ms linear, opacity 120ms ease";
      glow.style.opacity = "1";
      glow.style.transform = `translate(${ratioX * strength * 1.6}px, ${ratioY * strength * 1.6}px)`;
    }
  };

  const onLeave = () => {
    el.style.transition = `transform ${ease} ease`;
    el.style.transform = "translate(0, 0)";
    if (glow) {
      glow.style.transition = `transform ${ease} ease, opacity ${ease} ease`;
      glow.style.transform = "translate(0, 0)";
      glow.style.opacity = "0.0001";
    }
  };

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  bound.set(el, { onMove, onLeave });
}

/**
 * Enable effect globally (idempotent).
 * Scans for .magnetic-link / .magnetic-button / .magnetic-nav once.
 */
export function enableMagneticEffect(root = document, options = {}) {
  if (isEnabled) return;
  isEnabled = true;

  const selector = ".magnetic-link, .magnetic-button, .magnetic-nav";
  root.querySelectorAll(selector).forEach((el) => attachMagnetic(el, options));
}

/** Remove listeners and reset transforms. */
export function disableMagneticEffect(root = document) {
  if (!isEnabled) return;
  isEnabled = false;

  const selector = ".magnetic-link, .magnetic-button, .magnetic-nav";
  root.querySelectorAll(selector).forEach((el) => {
    const handlers = bound.get(el);
    if (!handlers) return;
    el.removeEventListener("mousemove", handlers.onMove);
    el.removeEventListener("mouseleave", handlers.onLeave);
    el.style.transition = "";
    el.style.transform = "";
    const glow = el.querySelector?.(".magnetic-glow");
    if (glow) {
      glow.style.transition = "";
      glow.style.transform = "";
      glow.style.opacity = "";
    }
    bound.delete(el);
  });
}

const Magnetic = {
  attachMagnetic,
  enableMagneticEffect,
  disableMagneticEffect,
};
export default Magnetic;