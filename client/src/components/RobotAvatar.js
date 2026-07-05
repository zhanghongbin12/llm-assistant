import React, { useId } from 'react';

function RobotAvatar({ size = 'medium', animated = false, pulsing = false }) {
  const uid = useId().replace(/:/g, '');
  const shellGradId = `shellGrad-${uid}`;
  const faceGradId = `faceGrad-${uid}`;
  const eyeGradId = `eyeGrad-${uid}`;
  const coreGradId = `coreGrad-${uid}`;
  const glowFilterId = `glow-${uid}`;
  const softGlowId = `softGlow-${uid}`;

  const dimensions = {
    small: 36,
    medium: 72,
    large: 120,
  };

  const dim = dimensions[size] || dimensions.medium;
  const className = [
    'robot-avatar',
    `robot-avatar--${size}`,
    animated ? 'robot-avatar--float' : '',
    pulsing ? 'robot-avatar--pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} style={{ width: dim, height: dim }} aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={shellGradId} x1="30" y1="20" x2="90" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2a5080" />
            <stop offset="45%" stopColor="#1a3555" />
            <stop offset="100%" stopColor="#0c1828" />
          </linearGradient>
          <linearGradient id={faceGradId} x1="40" y1="38" x2="80" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0a1420" />
            <stop offset="100%" stopColor="#111f30" />
          </linearGradient>
          <radialGradient id={eyeGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#80f0ff" />
            <stop offset="55%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0088bb" />
          </radialGradient>
          <radialGradient id={coreGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b8f8ff" />
            <stop offset="40%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#006688" />
          </radialGradient>
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={softGlowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* 背景光晕 */}
        <ellipse cx="60" cy="62" rx="38" ry="40" fill="#00c8ff" opacity="0.08" filter={`url(#${softGlowId})`} />

        {/* 天线 */}
        <path d="M60 10 L60 24" stroke="#4dd9ff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="60" cy="8" r="4.5" fill="#00f0ff" filter={`url(#${glowFilterId})`} />
        <circle cx="60" cy="8" r="2" fill="#e0ffff" opacity="0.9" />

        {/* 头部外壳 */}
        <rect x="28" y="26" width="64" height="52" rx="20" fill={`url(#${shellGradId})`} />
        <rect x="28" y="26" width="64" height="52" rx="20" stroke="#3a8ab0" strokeWidth="1.2" strokeOpacity="0.6" />
        <path
          d="M36 30 Q60 22 84 30"
          stroke="#6ecfff"
          strokeWidth="1"
          strokeOpacity="0.25"
          fill="none"
        />

        {/* 面部屏幕 */}
        <rect x="36" y="34" width="48" height="38" rx="14" fill={`url(#${faceGradId})`} />
        <rect x="36" y="34" width="48" height="38" rx="14" stroke="#00b8e0" strokeWidth="0.8" strokeOpacity="0.35" />

        {/* 眉毛装饰线 */}
        <path d="M44 42 Q50 39 56 42" stroke="#00c8e8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M64 42 Q70 39 76 42" stroke="#00c8e8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

        {/* 眼睛 */}
        <ellipse cx="50" cy="50" rx="7" ry="8" fill={`url(#${eyeGradId})`} filter={`url(#${glowFilterId})`} />
        <ellipse cx="70" cy="50" rx="7" ry="8" fill={`url(#${eyeGradId})`} filter={`url(#${glowFilterId})`} />
        <circle cx="52" cy="48" r="2" fill="#ffffff" opacity="0.95" />
        <circle cx="72" cy="48" r="2" fill="#ffffff" opacity="0.95" />
        <circle cx="48.5" cy="52" r="0.8" fill="#ffffff" opacity="0.4" />

        {/* 微笑 */}
        <path
          d="M48 62 Q60 69 72 62"
          stroke="#00d4ff"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />

        {/* 耳朵模块 */}
        <rect x="20" y="44" width="8" height="16" rx="4" fill="#1a3555" stroke="#3a8ab0" strokeWidth="0.8" strokeOpacity="0.5" />
        <rect x="92" y="44" width="8" height="16" rx="4" fill="#1a3555" stroke="#3a8ab0" strokeWidth="0.8" strokeOpacity="0.5" />
        <circle cx="24" cy="52" r="2" fill="#00d4ff" opacity="0.7" />
        <circle cx="96" cy="52" r="2" fill="#00d4ff" opacity="0.7" />

        {/* 颈部 */}
        <rect x="52" y="78" width="16" height="6" rx="3" fill="#152840" stroke="#3a8ab0" strokeWidth="0.6" strokeOpacity="0.4" />

        {/* 身体 */}
        <path
          d="M34 84 Q60 80 86 84 L90 108 Q60 114 30 108 Z"
          fill={`url(#${shellGradId})`}
          stroke="#3a8ab0"
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* 胸口能量核心 */}
        <circle cx="60" cy="96" r="9" fill="#0a1828" stroke="#00b8e0" strokeWidth="0.8" strokeOpacity="0.4" />
        <circle cx="60" cy="96" r="6" fill={`url(#${coreGradId})`} filter={`url(#${glowFilterId})`} opacity="0.95" />
        <circle cx="58" cy="94" r="1.5" fill="#ffffff" opacity="0.8" />

        {/* 肩甲 */}
        <path d="M26 86 Q22 92 24 98 L32 96 Q30 90 34 86 Z" fill="#1a3555" stroke="#3a8ab0" strokeWidth="0.6" strokeOpacity="0.4" />
        <path d="M94 86 Q98 92 96 98 L88 96 Q90 90 86 86 Z" fill="#1a3555" stroke="#3a8ab0" strokeWidth="0.6" strokeOpacity="0.4" />
      </svg>
    </div>
  );
}

export default RobotAvatar;
