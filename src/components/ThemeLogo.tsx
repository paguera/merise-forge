import { useState } from 'react';

interface ThemeLogoProps {
  className?: string;
  size?: number;
}

export function ThemeLogo({ className = '', size = 40 }: ThemeLogoProps) {
  const [imgSrc, setImgSrc] = useState('/logo.jpeg');

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl shadow-md ring-1 ring-primary/25 bg-background transition-all hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label="MERISE FORGE by PAGUERA"
    >
      <img
        src={imgSrc}
        alt="MERISE FORGE"
        className="w-full h-full object-cover"
        onError={() => {
          if (imgSrc === '/logo.jpeg') {
            setImgSrc('/logo.jpg');
          }
        }}
      />
    </div>
  );
}
