import type { Container } from 'pixi.js';

export class CrateTweens {
  private animations = new Map<Container, { elapsed: number; x: number; y: number; scale: number; alpha: number; toX: number; toY: number; toScale: number; toAlpha: number; remove: boolean; onComplete?: () => void }>();

  move(view: Container, x: number, y: number, scale: number, alpha: number, remove = false, onComplete?: () => void) {
    this.animations.set(view, { elapsed: 0, x: view.x, y: view.y, scale: view.scale.x, alpha: view.alpha,
      toX: x, toY: y, toScale: scale, toAlpha: alpha, remove, onComplete });
    if (remove) view.eventMode = 'none';
  }

  update(delta: number) {
    for (const [view, animation] of this.animations) {
      if (view.destroyed) { this.animations.delete(view); continue; }
      animation.elapsed += delta;
      const t = Math.min(1, animation.elapsed / 240);
      const eased = 1 - (1 - t) ** 3;
      view.position.set(animation.x + (animation.toX - animation.x) * eased, animation.y + (animation.toY - animation.y) * eased);
      view.scale.set(animation.scale + (animation.toScale - animation.scale) * eased);
      view.alpha = animation.alpha + (animation.toAlpha - animation.alpha) * eased;
      if (t === 1) {
        this.animations.delete(view);
        animation.onComplete?.();
        if (animation.remove) view.destroy({ children: true });
      }
    }
  }

  clear() { this.animations.clear(); }
}
