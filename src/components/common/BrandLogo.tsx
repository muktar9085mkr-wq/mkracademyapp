import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Award,
  School
} from 'lucide-react';
import { AppLogoSettings } from '../../types';

interface BrandLogoProps {
  settings?: AppLogoSettings;
  variant?: 'light' | 'dark'; // 'light' for dark backgrounds (white text), 'dark' for white/light backgrounds (dark text)
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  settings,
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);

  const text = settings?.text || 'MKR';
  const highlight = settings?.highlightText || 'ACADEMY';
  const subtitle = settings?.subtitle || 'Quality Notes • Better Results';
  const imageUrl = settings?.imageUrl?.trim();
  const showImageOnly = settings?.showImageOnly && imageUrl && !imageError;

  // Icon mapping
  const renderIcon = () => {
    const iconClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    switch (settings?.iconPreset) {
      case 'book':
        return <BookOpen className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      case 'award':
        return <Award className={iconClass} />;
      case 'school':
        return <School className={iconClass} />;
      case 'graduation':
      default:
        return <GraduationCap className={iconClass} />;
    }
  };

  const badgeSizeClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-10 h-10 rounded-xl';

  const textClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl'
      : 'text-lg sm:text-xl';

  const subtitleClass =
    size === 'sm'
      ? 'text-[8px]'
      : size === 'lg'
      ? 'text-xs'
      : 'text-[9px] sm:text-[10px]';

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 select-none min-w-0 ${className}`}>
      {/* Visual Badge or Custom Image */}
      {imageUrl && !imageError ? (
        <div
          className={`${badgeSizeClass} flex items-center justify-center overflow-hidden bg-white/10 rounded-xl shrink-0 border ${
            variant === 'light' ? 'border-white/20' : 'border-stone-200'
          }`}
        >
          <img
            src={imageUrl}
            alt={text}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-0.5"
          />
        </div>
      ) : (
        <div
          className={`${badgeSizeClass} bg-gradient-to-tr from-red-800 to-red-600 flex items-center justify-center text-white shadow-md shadow-red-950/20 shrink-0`}
        >
          {renderIcon()}
        </div>
      )}

      {/* Brand Text (Hidden if showImageOnly is true) */}
      {!showImageOnly && (
        <div className="flex flex-col text-left leading-tight min-w-0">
          <div className="flex items-center space-x-1.5 truncate">
            <span
              className={`font-black tracking-tight font-sans truncate ${textClass} ${
                variant === 'light' ? 'text-white' : 'text-stone-900'
              }`}
            >
              {text}{' '}
              <span className="text-red-600">{highlight}</span>
            </span>
          </div>
          {showSubtitle && (
            <p
              className={`font-semibold tracking-wide uppercase truncate hidden sm:block ${subtitleClass} ${
                variant === 'light' ? 'text-stone-300' : 'text-stone-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
