import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  multiline?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '', multiline = false }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={(e) => { e.stopPropagation(); setShow(true); }}
      onMouseLeave={(e) => { e.stopPropagation(); setShow(false); }}
    >
      {children}
      <div
        className={`tooltip-body transition-all duration-150 ${
          show ? 'visible opacity-100' : 'invisible opacity-0'
        } ${multiline ? 'text-left whitespace-normal max-w-56' : ''}`}
      >
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
