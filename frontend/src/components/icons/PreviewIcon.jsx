import React from 'react';

const PreviewIcon = ({ fill = "#D2232A", width = 24, height = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <circle cx="12" cy="12" r="10" fill={fill} />
    <line x1="12" y1="16" x2="12" y2="10" stroke="white" strokeWidth="2" />
    <circle cx="12" cy="8" r="1" fill="white" />
  </svg>
);

export default PreviewIcon;
