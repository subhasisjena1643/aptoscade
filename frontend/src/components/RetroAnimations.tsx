'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

export const RetroGlitch = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (elementRef.current) {
      // Enhanced dramatic glitch effect
      const triggerGlitch = () => {
        setIsGlitching(true);

        // Main glitch animation with multiple effects
        anime({
          targets: elementRef.current,
          translateX: [
            { value: 0, duration: 0 },
            { value: -8, duration: 50 },
            { value: 12, duration: 50 },
            { value: -6, duration: 50 },
            { value: 4, duration: 50 },
            { value: -10, duration: 50 },
            { value: 0, duration: 50 }
          ],
          translateY: [
            { value: 0, duration: 0 },
            { value: 2, duration: 50 },
            { value: -3, duration: 50 },
            { value: 1, duration: 50 },
            { value: -2, duration: 50 },
            { value: 4, duration: 50 },
            { value: 0, duration: 50 }
          ],
          filter: [
            { value: 'hue-rotate(0deg) saturate(1) contrast(1)', duration: 0 },
            { value: 'hue-rotate(180deg) saturate(3) contrast(2)', duration: 100 },
            { value: 'hue-rotate(270deg) saturate(0.5) contrast(3)', duration: 100 },
            { value: 'hue-rotate(90deg) saturate(2) contrast(1.5)', duration: 100 },
            { value: 'hue-rotate(0deg) saturate(1) contrast(1)', duration: 100 }
          ],
          scale: [
            { value: 1, duration: 0 },
            { value: 1.02, duration: 150 },
            { value: 0.98, duration: 150 },
            { value: 1, duration: 100 }
          ],
          complete: () => {
            setIsGlitching(false);
          }
        });
      };

      // Trigger glitch every 2-4 seconds randomly (more frequent)
      const scheduleNextGlitch = () => {
        const delay = 2000 + Math.random() * 2000;
        setTimeout(() => {
          triggerGlitch();
          scheduleNextGlitch();
        }, delay);
      };

      // Initial glitch after 1 second
      setTimeout(triggerGlitch, 1000);
      scheduleNextGlitch();
    }
  }, []);

  return (
    <div
      ref={elementRef}
      className={`${className} relative overflow-hidden`}
      style={{
        textShadow: isGlitching
          ? '2px 0 #ff0000, -2px 0 #00ffff, 0 2px #ffff00, 0 -2px #ff00ff'
          : '1px 0 #ff0000, -1px 0 #00ffff'
      }}
    >
      {children}

      {/* RGB Channel Separation Effect */}
      {isGlitching && (
        <>
          <div
            className="absolute inset-0 opacity-70 mix-blend-screen"
            style={{
              color: '#ff0000',
              transform: 'translateX(2px)',
              filter: 'blur(0.5px)'
            }}
          >
            {children}
          </div>
          <div
            className="absolute inset-0 opacity-70 mix-blend-screen"
            style={{
              color: '#00ffff',
              transform: 'translateX(-2px)',
              filter: 'blur(0.5px)'
            }}
          >
            {children}
          </div>
          <div
            className="absolute inset-0 opacity-50 mix-blend-screen"
            style={{
              color: '#ffff00',
              transform: 'translateY(1px)',
              filter: 'blur(1px)'
            }}
          >
            {children}
          </div>
        </>
      )}

      {/* Glitch Lines Effect */}
      {isGlitching && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-full h-0.5 bg-white opacity-80"
            style={{
              top: '20%',
              animation: 'glitch-line 0.3s linear infinite'
            }}
          />
          <div
            className="absolute w-full h-0.5 bg-cyan-400 opacity-60"
            style={{
              top: '60%',
              animation: 'glitch-line 0.2s linear infinite reverse'
            }}
          />
          <div
            className="absolute w-full h-0.5 bg-red-400 opacity-70"
            style={{
              top: '80%',
              animation: 'glitch-line 0.4s linear infinite'
            }}
          />
        </div>
      )}
    </div>
  );
};

export const RetroScanlines = ({ className = '' }: { className?: string }) => {
  const scanlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scanlineRef.current) {
      anime({
        targets: scanlineRef.current,
        translateY: ['-100vh', '100vh'],
        duration: 3000,
        loop: true,
        easing: 'linear'
      });
    }
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      <div
        ref={scanlineRef}
        className="absolute w-full h-2 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
        style={{
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
        }}
      />
    </div>
  );
};

export const RetroPixelRain = ({ count = 50 }: { count?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof window !== 'undefined') {
      const pixels = Array.from({ length: count }, (_, i) => {
        const pixel = document.createElement('div');
        pixel.className = 'absolute w-1 h-1 bg-cyan-400 rounded-full';
        pixel.style.left = `${Math.random() * 100}%`;
        pixel.style.top = `${Math.random() * 100}%`;
        containerRef.current?.appendChild(pixel);
        return pixel;
      });

      // Use CSS animations instead of anime.js for better compatibility
      pixels.forEach((pixel, index) => {
        pixel.style.animation = `retro-pixel-fall ${2 + Math.random() * 2}s linear infinite`;
        pixel.style.animationDelay = `${index * 100}ms`;
      });

      return () => {
        pixels.forEach(pixel => pixel.remove());
      };
    }
  }, [count]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10" />
  );
};

export const RetroTypewriter = ({ 
  text, 
  speed = 50, 
  className = '',
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  className?: string;
  onComplete?: () => void;
}) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.textContent = '';

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (textRef.current && currentIndex <= text.length) {
          textRef.current.textContent = text.slice(0, currentIndex);
          currentIndex++;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, speed);

      return () => clearInterval(interval);
    }
  }, [text, speed, onComplete]);

  return <span ref={textRef} className={className} />;
};

export const RetroWindowFloat = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (windowRef.current) {
      anime({
        targets: windowRef.current,
        translateY: [
          { value: -5, duration: 2000 },
          { value: 5, duration: 2000 }
        ],
        rotate: [
          { value: -0.5, duration: 3000 },
          { value: 0.5, duration: 3000 }
        ],
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    }
  }, []);

  return (
    <div ref={windowRef} className={className}>
      {children}
    </div>
  );
};

export const RetroProgressBar = ({ 
  progress, 
  className = '',
  animated = true 
}: { 
  progress: number; 
  className?: string;
  animated?: boolean;
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current && animated) {
      anime({
        targets: fillRef.current,
        width: `${progress}%`,
        duration: 1000,
        easing: 'easeOutQuart'
      });
    }
  }, [progress, animated]);

  return (
    <div ref={progressRef} className={`retro-progress ${className}`}>
      <div 
        ref={fillRef} 
        className="retro-progress-fill"
        style={{ width: animated ? '0%' : `${progress}%` }}
      />
    </div>
  );
};

export const RetroButton = ({
  children,
  onClick,
  className = '',
  variant = 'default'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'accent' | 'secondary';
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('RetroButton clicked', { variant, onClick: !!onClick });
    
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: [1, 0.95, 1],
        duration: 150,
        easing: 'easeOutQuart'
      });
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`retro-button ${variant} ${className} relative z-10`}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </button>
  );
};

export const RetroMatrix = ({ className = '' }: { className?: string }) => {
  const matrixRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matrixRef.current && typeof window !== 'undefined') {
      const chars = '01';
      const drops: number[] = [];
      const fontSize = 10;
      const columns = Math.floor(window.innerWidth / fontSize);

      for (let i = 0; i < columns; i++) {
        drops[i] = 1;
      }

      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.opacity = '0.1';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f0';
        ctx.font = `${fontSize}px monospace`;

        const draw = () => {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#0f0';
          for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
        };

        const interval = setInterval(draw, 33);
        matrixRef.current?.appendChild(canvas);

        return () => {
          clearInterval(interval);
          canvas.remove();
        };
      }
    }
  }, []);

  return <div ref={matrixRef} className={`fixed inset-0 pointer-events-none z-5 ${className}`} />;
};

export const RetroBootSequence = ({
  onComplete,
  className = ''
}: {
  onComplete?: () => void;
  className?: string;
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  const bootLines = [
        'Memory Test Complete... OK',
    'APTOSCADE BIOS v2.1.0',
    'Copyright (C) 2024-2025 Aptoscade Corp.',
    'Initializing Web3 Gaming Protocol...',
    'Connecting to Ethereum Layer 2...',
    'Smart Contract Verification: PASSED',
    'Player Authentication: READY',
    'Real-time Multiplayer Engine: ACTIVE',
    'AI Companion System: ENABLED',
    'System Ready. Welcome to Aptoscade!'
  ];

  useEffect(() => {
    if (currentLine < bootLines.length) {
      const timer = setTimeout(() => {
        setCurrentLine(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLine, bootLines.length, onComplete]);

  return (
    <div className={`font-mono text-green-400 text-sm ${className}`}>
      {bootLines.slice(0, currentLine).map((line, index) => (
        <div key={index} className="mb-1">
          &gt; {line}
          {index === currentLine - 1 && <span className="retro-blink">█</span>}
        </div>
      ))}
    </div>
  );
};

export const RetroHologram = ({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const hologramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hologramRef.current) {
      anime({
        targets: hologramRef.current,
        opacity: [0.7, 1, 0.7],
        filter: [
          'hue-rotate(0deg) brightness(1)',
          'hue-rotate(180deg) brightness(1.2)',
          'hue-rotate(0deg) brightness(1)'
        ],
        duration: 3000,
        loop: true,
        easing: 'easeInOutSine'
      });
    }
  }, []);

  return (
    <div
      ref={hologramRef}
      className={`relative ${className}`}
      style={{
        background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1))',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(255, 0, 255, 0.1)'
      }}
    >
      {children}
    </div>
  );
};

export const RetroSoundEffect = () => {
  const playBeep = () => {
    try {
      // Create a simple beep sound using Web Audio API
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      // Silently fail if Web Audio API is not available
      console.log('Web Audio API not available');
    }
  };

  return { playBeep };
};

export const RetroParticleSystem = ({
  count = 20,
  className = ''
}: {
  count?: number;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const particles = Array.from({ length: count }, (_, i) => {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-cyan-400 rounded-full';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        containerRef.current?.appendChild(particle);
        return particle;
      });

      anime({
        targets: particles,
        translateX: () => Math.random() * 100 - 50,
        translateY: () => Math.random() * 100 - 50,
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        duration: () => Math.random() * 2000 + 2000,
        delay: () => Math.random() * 2000,
        loop: true,
        easing: 'easeInOutQuad'
      });

      return () => {
        particles.forEach(particle => particle.remove());
      };
    }
  }, [count]);

  return (
    <div ref={containerRef} className={`fixed inset-0 pointer-events-none z-10 ${className}`} />
  );
};

export const RetroStatusBar = ({
  label,
  value,
  maxValue = 100,
  className = ''
}: {
  label: string;
  value: number;
  maxValue?: number;
  className?: string;
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className={`retro-panel p-2 ${className}`}>
      <div className="pixel-text mb-1" style={{ fontSize: '8px' }}>
        {label}: {value}/{maxValue}
      </div>
      <RetroProgressBar progress={percentage} animated={true} />
    </div>
  );
};

export const RetroNotification = ({
  message,
  type = 'info',
  onClose,
  className = ''
}: {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  className?: string;
}) => {
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notificationRef.current) {
      anime({
        targets: notificationRef.current,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuart'
      });

      const timer = setTimeout(() => {
        if (notificationRef.current) {
          anime({
            targets: notificationRef.current,
            translateX: [0, 300],
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInQuart',
            onComplete: onClose
          });
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [onClose]);

  const typeColors = {
    info: 'border-cyan-400 text-cyan-400',
    success: 'border-green-400 text-green-400',
    warning: 'border-yellow-400 text-yellow-400',
    error: 'border-red-400 text-red-400'
  };

  return (
    <div
      ref={notificationRef}
      className={`retro-window p-4 ${typeColors[type]} ${className}`}
    >
      <div className="pixel-text" style={{ fontSize: '10px' }}>
        {message}
      </div>
    </div>
  );
};

// Enhanced Background Animations
export const RetroFloatingElements = ({ count = 15 }: { count?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof window !== 'undefined') {
      const elements = Array.from({ length: count }, (_, i) => {
        const element = document.createElement('div');
        const shapes = ['◆', '◇', '▲', '△', '●', '○', '■', '□', '★', '☆'];
        const colors = ['text-cyan-400', 'text-yellow-400', 'text-green-400', 'text-blue-400', 'text-purple-400'];

        element.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        element.className = `absolute ${colors[Math.floor(Math.random() * colors.length)]} opacity-20 pointer-events-none`;
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.fontSize = `${8 + Math.random() * 8}px`;
        element.style.animation = `retro-float ${10 + Math.random() * 20}s linear infinite`;
        element.style.animationDelay = `${Math.random() * 10}s`;

        containerRef.current?.appendChild(element);
        return element;
      });

      return () => {
        elements.forEach(element => element.remove());
      };
    }
  }, [count]);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export const RetroGridLines = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'retro-grid-move 20s linear infinite'
      }} />
    </div>
  );
};

export const RetroDataStream = ({ lines = 8 }: { lines?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof window !== 'undefined') {
      const dataLines = Array.from({ length: lines }, (_, i) => {
        const line = document.createElement('div');
        const data = Array.from({ length: 20 }, () =>
          Math.random().toString(16).substr(2, 1).toUpperCase()
        ).join('');

        line.textContent = `> ${data}`;
        line.className = 'absolute text-green-400 font-mono opacity-30 pointer-events-none';
        line.style.fontSize = '8px';
        line.style.left = `${Math.random() * 80}%`;
        line.style.top = `${Math.random() * 100}%`;
        line.style.animation = `retro-data-scroll ${5 + Math.random() * 10}s linear infinite`;
        line.style.animationDelay = `${i * 0.5}s`;

        containerRef.current?.appendChild(line);
        return line;
      });

      return () => {
        dataLines.forEach(line => line.remove());
      };
    }
  }, [lines]);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />;
};
