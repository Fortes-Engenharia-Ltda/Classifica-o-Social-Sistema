import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const brandName = import.meta.env.VITE_COMPANY_NAME || 'Classificação Social';
const brandLogoLight = import.meta.env.VITE_COMPANY_LOGO_LIGHT?.trim();
const brandLogoDark = import.meta.env.VITE_COMPANY_LOGO_DARK?.trim();
const brandLogoAlt = import.meta.env.VITE_COMPANY_LOGO_ALT || brandName;

const getInitials = (value: string): string => {
  const initials = value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials ? initials.toUpperCase() : 'CS';
};

export const BrandMark: React.FC<BrandMarkProps> = ({
  compact = false,
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const sizeClasses = compact ? 'h-12 w-12 rounded-lg' : 'h-20 w-20 rounded-2xl';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex items-center justify-center overflow-hidden bg-transparent text-white ${sizeClasses}`}
      >
        {brandLogoLight || brandLogoDark ? (
          <>
            {brandLogoLight ? (
              <img src={brandLogoLight} alt={brandLogoAlt} className="h-full w-full object-contain dark:hidden" />
            ) : null}
            {brandLogoDark ? (
              <img src={brandLogoDark} alt={brandLogoAlt} className="hidden h-full w-full object-contain dark:block" />
            ) : null}
          </>
        ) : (
          <span className={`font-semibold tracking-[0.2em] ${compact ? 'text-[0.72rem]' : 'text-sm'}`}>
            {getInitials(brandName)}
          </span>
        )}
      </div>

      {showText ? (
        <div className="leading-tight">
          <p className={`font-semibold text-slate-900 dark:text-white ${textClassName}`}>{brandName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestão corporativa de NF</p>
        </div>
      ) : null}
    </div>
  );
};

export const DevelopedBy: React.FC<{ className?: string; inline?: boolean }> = ({ className = '', inline = false }) => {
  const label = import.meta.env.VITE_DEV_BY_LABEL || 'Desenvolvido por';
  const logoLight = import.meta.env.VITE_DEV_LOGO_LIGHT?.trim();
  const logoDark = import.meta.env.VITE_DEV_LOGO_DARK?.trim();
  const alt = import.meta.env.VITE_DEV_LOGO_ALT || 'Desenvolvido por';

  if (!logoLight && !logoDark) {
    return null;
  }

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</p>
        <div className="h-6">
          {logoLight ? <img src={logoLight} alt={alt} className="h-full max-w-[120px] object-contain dark:hidden" /> : null}
          {logoDark ? (
            <img src={logoDark} alt={alt} className="hidden h-full max-w-[120px] object-contain dark:block" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ${className}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-2 h-10">
        {logoLight ? <img src={logoLight} alt={alt} className="h-full max-w-[180px] object-contain dark:hidden" /> : null}
        {logoDark ? (
          <img src={logoDark} alt={alt} className="hidden h-full max-w-[180px] object-contain dark:block" />
        ) : null}
      </div>
    </div>
  );
};