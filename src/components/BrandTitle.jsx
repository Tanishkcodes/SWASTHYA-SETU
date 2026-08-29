import React from 'react';
import '../styles/brand.css';

/**
 * BrandTitle Component
 * Renders "SWASTHYA SETU" with the exact stylistic identity from the brand mark:
 * - Geometric uppercase typography
 * - "SWASTHYA" in deep navy with stylized 'A's containing the iconic teal dot
 * - "SETU" in vibrant vermilion orange
 * - Optional tagline "CONNECTING EVERY STEP OF CARE" with dual teal/orange accent rules
 * - Mesmerizing dynamic fluid animated gradient color sweep when loaded
 */
export default function BrandTitle({ 
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  showTagline = false,
  taglineSize = 'sm',
  className = '',
  light = false,
  animated = true
}) {
  return (
    <div className={`brand-title-container brand-size-${size} ${light ? 'brand-light' : ''} ${className}`}>
      <div className={`brand-main ${animated ? 'brand-animated' : ''}`}>
        {/* SWASTHYA in Navy Blue with stylized 'A's */}
        <span className="brand-word-swasthya">
          <span className="brand-letter">S</span>
          <span className="brand-letter">W</span>
          
          {/* Custom Styled 'A' with Teal Dot */}
          <span className="brand-letter brand-letter-a">
            <span className="a-shape">A</span>
            <span className="a-dot" />
          </span>

          <span className="brand-letter">S</span>
          <span className="brand-letter">T</span>
          <span className="brand-letter">H</span>
          <span className="brand-letter">Y</span>

          {/* Second Custom Styled 'A' with Teal Dot */}
          <span className="brand-letter brand-letter-a">
            <span className="a-shape">A</span>
            <span className="a-dot" />
          </span>
        </span>

        {/* Space separator */}
        <span className="brand-spacer">&nbsp;</span>

        {/* SETU in Vibrant Orange */}
        <span className="brand-word-setu">
          <span className="brand-letter">S</span>
          <span className="brand-letter">E</span>
          <span className="brand-letter">T</span>
          <span className="brand-letter">U</span>
        </span>
      </div>

      {showTagline && (
        <div className={`brand-tagline brand-tagline-${taglineSize}`}>
          <span className="tagline-rule rule-teal" />
          <span className="tagline-text">CONNECTING EVERY STEP OF CARE</span>
          <span className="tagline-rule rule-orange" />
        </div>
      )}
    </div>
  );
}
