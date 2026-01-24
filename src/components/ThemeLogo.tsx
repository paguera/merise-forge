import logoThemes from '@/assets/logo-themes.png';
import { useTheme } from '@/hooks/useTheme';

interface ThemeLogoProps {
  className?: string;
  size?: number;
}

export function ThemeLogo({ className = '', size = 40 }: ThemeLogoProps) {
  const { theme } = useTheme();

  // The uploaded image has 3 logos stacked vertically:
  // - Top third: Light theme (white background)
  // - Middle third: Dark theme (dark blue background)
  // - Bottom third: Spotify theme (black/green background)
  // We use background-position to show the correct portion

  const getBackgroundPosition = () => {
    switch (theme) {
      case 'light':
        return '0 0%'; // Top portion
      case 'dark':
        return '0 50%'; // Middle portion
      case 'spotify':
        return '0 100%'; // Bottom portion
      default:
        return '0 50%';
    }
  };

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${logoThemes})`,
        backgroundSize: 'auto 300%', // 3 logos stacked = 300% height
        backgroundPosition: getBackgroundPosition(),
        backgroundRepeat: 'no-repeat',
      }}
      aria-label="Ressou Merise Logo"
    />
  );
}
