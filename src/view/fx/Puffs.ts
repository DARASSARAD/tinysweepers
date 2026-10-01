import { Container, Graphics } from 'pixi.js';
import { Config } from '../../core/Config';
import { Pool } from '../Pool';

interface Particle { shape: Graphics; age: number; x: number; y: number; dx: number; dy: number }

export class Puffs extends Container {
  private readonly pool = new Pool(() => new Graphics().circle(0, 0, 9).fill('#fffaf0'));
  private readonly particles: Particle[] = [];

  burst(x: number, y: number) {
    for (let i = 0; i < Config.effects.puffCount; i++) {
      const angle = i * Math.PI * 2 / Config.effects.puffCount;
      const shape = this.pool.take();
      shape.visible = true;
      this.addChild(shape);
      this.particles.push({ shape, age: 0, x, y, dx: Math.cos(angle) * 70, dy: Math.sin(angle) * 70 });
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += delta;
      const progress = Math.min(1, particle.age / Config.effects.puffMs);
      particle.shape.position.set(particle.x + particle.dx * progress, particle.y + particle.dy * progress);
      particle.shape.alpha = 1 - progress;
      particle.shape.scale.set(1 - progress * 0.7);
      if (progress === 1) {
        this.removeChild(particle.shape);
        this.pool.release(particle.shape);
        this.particles.splice(i, 1);
      }
    }
  }

  override destroy() {
    this.pool.dispose(shape => shape.destroy());
    super.destroy({ children: true });
  }
}
