'use client';

import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getAudioEnergy } from '@/lib/audioAnalysis';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  pulsePhase: number;
  color: string;
}

export function ParticleDust({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const palette = usePlayerStore((s) => s.currentTrack.palette);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color choices from current track palette
    const colors = [
      palette?.[2] || '#7C3AED',
      palette?.[3] || '#06B6D4',
      '#FFFFFF',
      palette?.[1] || '#F43F5E',
    ];

    // Initialize 45 gentle stardust motes
    const particleCount = 45;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = 0.15 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.35, // Gentle upward drift
        radius: 0.8 + Math.random() * 1.8,
        alpha: baseAlpha,
        baseAlpha,
        pulsePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      const energy = getAudioEnergy(isPlaying);
      const speedMultiplier = isPlaying ? 0.7 + energy.overall * 1.6 : 0.5;
      const glowBlur = isPlaying ? Math.round(4 + energy.bass * 10) : 3;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wrap around boundaries
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Subtle luminance breathing
        p.pulsePhase += dt * (isPlaying ? 2.5 + energy.bass * 3.5 : 1.0);
        const pulse = Math.sin(p.pulsePhase) * 0.25;
        const currentAlpha = Math.max(0.05, Math.min(0.9, p.baseAlpha + pulse + energy.bass * 0.15));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + energy.bass * 0.4), 0, Math.PI * 2);

        // Soft outer glow
        ctx.shadowBlur = glowBlur;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, palette]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none select-none z-0 ${className}`}
      style={{ opacity: 0.75 }}
    />
  );
}
