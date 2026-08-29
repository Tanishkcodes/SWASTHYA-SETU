import React from 'react';

/**
 * SwasthyaLogo — "The Modern Medical Cross"
 * 
 * Replaced the heart with the ultimate clean, modern medical symbol.
 * Made of 4 beautifully rounded geometric pills coming together.
 * - Top (Navy): The Doctor / Professionalism
 * - Bottom (Light Blue): The Tech / Digital Platform
 * - Right (Teal): The Health / Swasthya
 * - Left (Orange): The Voice / Energy
 * 
 * Incredibly clean, no messy lines, instantly recognizable as a premium health app.
 */
export default function SwasthyaLogo({ size = 44, className = '', style = {}, animated = true }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`modern-cross-logo ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.06))',
        ...style
      }}
    >
      <g style={{ transition: 'all 0.4s ease' }} className={animated ? 'cross-animate' : ''}>
        {/* Top Pill - Navy */}
        <rect 
          x="42" y="10" 
          width="16" height="34" 
          rx="8" 
          fill="#1E3A8A" 
        />
        
        {/* Right Pill - Teal */}
        <rect 
          x="56" y="42" 
          width="34" height="16" 
          rx="8" 
          fill="#0D9488" 
        />
        
        {/* Bottom Pill - Light Blue */}
        <rect 
          x="42" y="56" 
          width="16" height="34" 
          rx="8" 
          fill="#38BDF8" 
        />
        
        {/* Left Pill - Vibrant Orange */}
        <rect 
          x="10" y="42" 
          width="34" height="16" 
          rx="8" 
          fill="#EA580C" 
        />
        
        {/* Center Connector Dot */}
        <circle 
          cx="50" cy="50" 
          r="8" 
          fill="#F8FAFC" 
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
