import React from 'react';

export default function Logo({ size = 40, color = "currentColor", className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill={color} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left 'R' Shape */}
      <path 
        d="M 47 7.5 L 47 44 L 35 56 L 47 76 L 47 92.5 L 34 86 L 26 60 L 26 82 L 10 74 L 10 26 Z M 46.5 24 L 26 34 L 26 44 L 46.5 44 Z" 
      />
      {/* Right 'G' Shape */}
      <path 
        d="M 53 7.5 L 90 26 L 90 74 L 53 92.5 L 53 76 L 74 65.5 L 74 54 L 53 54 L 53 44 L 74 44 L 74 34 L 53 23.5 Z" 
      />
    </svg>
  );
}
