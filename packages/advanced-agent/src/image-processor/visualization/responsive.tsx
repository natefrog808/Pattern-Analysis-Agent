// packages/advanced-agent/src/image-processor/visualization/responsive.tsx

import React from 'react';
import { useMediaQuery } from 'react-responsive';

export const ResponsiveWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  return (
    <div className={`
      ${className}
      ${isMobile ? 'space-y-4' : 'space-y-6'}
      ${isMobile ? 'p-4' : 'p-6'}
    `}>
      {children}
    </div>
  );
};

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  columns?: number;
}> = ({ children, columns = 3 }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  const gridCols = isMobile ? 1 : isTablet ? 2 : columns;

  return (
    <div className={`grid grid-cols-${gridCols} gap-4`}>
      {children}
    </div>
  );
};

export const ResponsiveChart: React.FC<{
  data: any[];
  height?: number;
}> = ({ data, height = 300 }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ 
        width: isMobile ? '100%' : '600px',
        height: isMobile ? height * 0.8 : height 
      }}>
        <LineChart data={data} />
      </div>
    </div>
  );
};
