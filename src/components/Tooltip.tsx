import React, { useEffect, useRef, useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  multiline?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '', multiline = false }) => {
  const [show, setShow] = useState(false);
  const hideTimer = useRef<number | null>(null);

  // На тач-устройствах подсказка показывается на 3 секунды: hover там нет.
  const showTemporarily = () => {
    setShow(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShow(false), 3000);
  };

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={(e) => { e.stopPropagation(); setShow(true); }}
      onMouseLeave={(e) => { e.stopPropagation(); setShow(false); }}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      onTouchStart={showTemporarily}
    >
      {children}
      <div
        role="tooltip"
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
