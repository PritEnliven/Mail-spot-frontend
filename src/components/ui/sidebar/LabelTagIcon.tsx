import React from 'react';

interface LabelTagIconProps {
  color?: string;
  className?: string;
  size?: number;
}

/** Gmail-style solid label / tag icon. */
export const LabelTagIcon: React.FC<LabelTagIconProps> = ({
  color = '#808080',
  className = 'hover-image',
  size = 16,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, flexShrink: 0, stroke: 'none' }}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M1.5 3.25C1.5 2.55964 2.05964 2 2.75 2H7.85C8.15 2 8.435 2.112 8.65 2.31L13.9 7.15C14.35 7.565 14.35 8.275 13.9 8.69L8.65 13.53C8.435 13.728 8.15 13.84 7.85 13.84H2.75C2.05964 13.84 1.5 13.2804 1.5 12.59V3.25Z"
      fill={color}
      stroke="none"
    />
  </svg>
);

export default LabelTagIcon;
