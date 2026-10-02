import { Container, Graphics } from 'pixi.js';
import { Config } from '../../core/Config';
import { Pool } from '../Pool';

interface Particle { shape: Graphics; age: number; x: number; y: number; dx: number; dy: number; size: number; lifetime: number }

export class Puffs extends Container {
  private readonly pool = new Pool(() => new Graphics().circle(0, 0, 9).fill('#ffffff'));
  private readonly particles: Particle[] = [];

  burst(x: number, y: number, size = 1, color = '#fffaf0', scattered = false) {
    const count = scattered ? 10 : Config.effects.puffCount + Math.floor(Math.random() * 5) - 2;
    const rotation = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = scattered ? Math.random() * Math.PI * 2
        : rotation + (i + Math.random() * 0.8) * Math.PI * 2 / count;
      const distance = 70 * size * (0.45 + Math.random() * 0.9);
      const particleSize = size * (0.45 + Math.random() * 0.75);
      const startX = x + (Math.random() - 0.5) * 22 * size;
      const startY = y + (Math.random() - 0.5) * 14 * size;
      const shape = this.pool.take();
      shape.visible = true;
      shape.tint = color;
      shape.position.set(startX, startY);
      shape.alpha = 1;
      shape.scale.set(particleSize);
      this.addChild(shape);
      this.particles.push({ shape, age: 0, x: startX, y: startY,
        dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance - (scattered ? 0 : 15 + Math.random() * 25),
        size: particleSize, lifetime: Config.effects.puffMs * (0.7 + Math.random() * 0.6) });
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += delta;
      const progress = Math.min(1, particle.age / particle.lifetime);
      particle.shape.position.set(particle.x + particle.dx * progress, particle.y + particle.dy * progress);
      particle.shape.alpha = 1 - progress;
      particle.shape.scale.set(particle.size * (1 - progress * 0.7));
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
