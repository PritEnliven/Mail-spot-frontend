// import React, { useId } from 'react';

// interface LabelTagIconProps {
//   color?: string;
//   className?: string;
//   size?: number;
// }

// /** Tag-shaped label icon — same stroke + light fill treatment as folder icons. */
// export const LabelTagIcon: React.FC<LabelTagIconProps> = ({
//   color = '#808080',
//   className = 'hover-image',
//   size = 16,
// }) => {
//   const gradId = `label-tag-fill-${useId().replace(/:/g, '')}`;

//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 16 16"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//       className={className}
//       style={{ minWidth: size, flexShrink: 0 }}
//       aria-hidden="true"
//       focusable="false"
//     >
//       <path
//         d="M1.5 3.25C1.5 2.55964 2.05964 2 2.75 2H7.85C8.15 2 8.435 2.112 8.65 2.31L13.9 7.15C14.35 7.565 14.35 8.275 13.9 8.69L8.65 13.53C8.435 13.728 8.15 13.84 7.85 13.84H2.75C2.05964 13.84 1.5 13.2804 1.5 12.59V3.25Z"
//         fill={`url(#${gradId})`}
//         stroke={color}
//         strokeWidth="1.25"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//       <defs>
//         <linearGradient
//           id={gradId}
//           x1="8"
//           y1="13.84"
//           x2="8"
//           y2="2"
//           gradientUnits="userSpaceOnUse"
//         >
//           <stop offset="0.735577" stopColor={color} stopOpacity="0.16" />
//           <stop offset="0.735677" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//     </svg>
//   );
// };

// export default LabelTagIcon;



import React, { useId } from 'react';

interface LabelTagIconProps {
  color?: string;
  className?: string;
  size?: number;
}

/** Tag-shaped label icon — same stroke + light fill treatment as folder icons. */
export const LabelTagIcon: React.FC<LabelTagIconProps> = ({
  color = '#808080',
  className = 'hover-image',
  size = 20,
}) => {
  const gradId = `label-tag-fill-${useId().replace(/:/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ minWidth: size, flexShrink: 0 }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1.5 3.25C1.5 2.55964 2.05964 2 2.75 2H7.85C8.15 2 8.435 2.112 8.65 2.31L13.9 7.15C14.35 7.565 14.35 8.275 13.9 8.69L8.65 13.53C8.435 13.728 8.15 13.84 7.85 13.84H2.75C2.05964 13.84 1.5 13.2804 1.5 12.59V3.25Z"
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={gradId}
          x1="8"
          y1="13.84"
          x2="8"
          y2="2"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.735577" stopColor={color} stopOpacity="0.16" />
          <stop offset="0.735677" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default LabelTagIcon;