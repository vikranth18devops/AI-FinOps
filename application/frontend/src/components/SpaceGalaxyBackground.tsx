import React, { useEffect, useRef } from 'react';

export const SpaceGalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse Cursor Position for Interactive Spider Web
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 180
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // 1. Cyber Spider Web Nodes
    const webNodeCount = Math.min(85, Math.floor((width * height) / 10000));
    const webNodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }[] = [];

    const nodeColors = ['#38bdf8', '#818cf8', '#c084fc', '#34d399'];

    for (let i = 0; i < webNodeCount; i++) {
      webNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 1,
        color: nodeColors[Math.floor(Math.random() * nodeColors.length)]
      });
    }

    // 2. Deep Space Starfield Particles
    const starCount = Math.min(160, Math.floor((width * height) / 9000));
    const stars: {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      twinkleSpeed: number;
    }[] = [];

    const starColors = ['#ffffff', '#c7d2fe', '#a5f3fc', '#e9d5ff', '#fef08a'];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        alpha: Math.random(),
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1)
      });
    }

    // 3. Shooting Stars / Meteors
    let meteor = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      active: false
    };

    const spawnMeteor = () => {
      meteor = {
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.4,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 8 + 6,
        active: true
      };
    };

    let meteorTimer = setInterval(spawnMeteor, 5000);

    // 4. 5 Multi-Layered Orbital Trajectory Parameters
    let orbitAngle1 = 0;
    let orbitAngle2 = Math.PI;
    let orbitAngle3 = Math.PI * 0.5;
    let orbitAngle4 = Math.PI * 1.2;
    let orbitAngle5 = Math.PI * 0.7;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // A. Galaxy Cosmic Nebula Dust
      const neb1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 50, width * 0.2, height * 0.3, 550);
      neb1.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      neb1.addColorStop(0.5, 'rgba(168, 85, 247, 0.09)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 50, width * 0.8, height * 0.7, 500);
      neb2.addColorStop(0, 'rgba(6, 182, 212, 0.14)');
      neb2.addColorStop(0.6, 'rgba(99, 102, 241, 0.07)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // B. Render 5 Animated 3D Cosmic Orbital Trajectory Rings
      const centerX = width * 0.5;
      const centerY = height * 0.45;

      orbitAngle1 += 0.0035;
      orbitAngle2 -= 0.0025;
      orbitAngle3 += 0.0018;
      orbitAngle4 -= 0.003;
      orbitAngle5 += 0.0022;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Orbit 1
      ctx.save();
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.32, height * 0.15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      const sat1X = Math.cos(orbitAngle1) * (width * 0.32);
      const sat1Y = Math.sin(orbitAngle1) * (height * 0.15);
      ctx.beginPath();
      ctx.arc(sat1X, sat1Y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();

      // Orbit 2
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.42, height * 0.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([10, 6]);
      ctx.stroke();
      const sat2X = Math.cos(orbitAngle2) * (width * 0.42);
      const sat2Y = Math.sin(orbitAngle2) * (height * 0.2);
      ctx.beginPath();
      ctx.arc(sat2X, sat2Y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();

      // Orbit 3
      ctx.save();
      ctx.rotate(Math.PI / 12);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.52, height * 0.25, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.14)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      const sat3X = Math.cos(orbitAngle3) * (width * 0.52);
      const sat3Y = Math.sin(orbitAngle3) * (height * 0.25);
      ctx.beginPath();
      ctx.arc(sat3X, sat3Y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      // Orbit 4
      ctx.save();
      ctx.rotate((5 * Math.PI) / 12);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.48, height * 0.18, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.13)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      const sat4X = Math.cos(orbitAngle4) * (width * 0.48);
      const sat4Y = Math.sin(orbitAngle4) * (height * 0.18);
      ctx.beginPath();
      ctx.arc(sat4X, sat4Y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();

      // Orbit 5
      ctx.save();
      ctx.rotate(-Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.62, height * 0.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.11)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const sat5X = Math.cos(orbitAngle5) * (width * 0.62);
      const sat5Y = Math.sin(orbitAngle5) * (height * 0.28);
      ctx.beginPath();
      ctx.arc(sat5X, sat5Y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f472b6';
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // C. Render Twinkling Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.alpha += star.twinkleSpeed;
        if (star.alpha >= 1 || star.alpha <= 0.1) {
          star.twinkleSpeed *= -1;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // D. Render Interactive Cyber Spider Web Mesh
      for (let i = 0; i < webNodes.length; i++) {
        const nodeA = webNodes[i];

        // Move Spider Web Nodes
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // Bounce off canvas boundaries
        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

        // Draw Spider Web Node Dots
        ctx.save();
        ctx.fillStyle = nodeA.color;
        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, nodeA.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Connect Spider Web Lines Between Nearby Nodes
        for (let j = i + 1; j < webNodes.length; j++) {
          const nodeB = webNodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 135;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.28;
            ctx.save();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Connect Interactive Spider Web Lines to Mouse Cursor
        if (mouse.x > 0 && mouse.y > 0) {
          const mdx = nodeA.x - mouse.x;
          const mdy = nodeA.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < mouse.radius) {
            const mAlpha = (1 - mdist / mouse.radius) * 0.55;
            ctx.save();
            ctx.strokeStyle = `rgba(56, 189, 248, ${mAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // E. Render Shooting Star / Meteor Trail
      if (meteor.active) {
        ctx.save();
        const grad = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.length, meteor.y - meteor.length * 0.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.6)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.length, meteor.y - meteor.length * 0.5);
        ctx.stroke();

        meteor.x += meteor.speed;
        meteor.y += meteor.speed * 0.5;

        if (meteor.x > width || meteor.y > height) {
          meteor.active = false;
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(meteorTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030612]">
      {/* Deep Space Starfield, Galaxy, Spider Web & 5 Orbital Trajectories Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Galaxy Spiral Glow Orbs */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-float" />
    </div>
  );
};
