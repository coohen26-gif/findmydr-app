/**
 * lib/design-system.js
 * Centralized design tokens + reusable components for FindMyDoctor.ae
 * Style: medical pro (Doctolib-inspired) — white, blue, clean, lots of space
 */

// === DESIGN TOKENS ===
export const colors = {
  // Primary
  primary: '#0066FF',        // Doctolib blue
  primaryDark: '#0052CC',
  primaryLight: '#E6F0FF',
  primaryHover: '#0052CC',

  // Neutrals
  white: '#FFFFFF',
  bg: '#F7F9FC',             // light gray-blue background
  bgSubtle: '#EEF1F6',
  border: '#E1E5EC',
  borderLight: '#F0F2F6',
  text: '#1A1A2E',           // dark text
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Plan badges
  premium: '#F59E0B',        // gold
  premiumLight: '#FEF3C7',
  free: '#9CA3AF',
};

export const space = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
  xxxl: '4rem',
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
};

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  md: '0 2px 8px rgba(0,0,0,0.06)',
  lg: '0 8px 24px rgba(0,0,0,0.08)',
  xl: '0 20px 60px rgba(0,0,0,0.12)',
};

export const font = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '2rem',
    display: '2.5rem',
  },
};

// === COMMON STYLES (CSS-in-JS object) ===
export const page = {
  background: colors.bg,
  minHeight: '100vh',
  fontFamily: font.sans,
  color: colors.text,
};

export const card = {
  background: colors.white,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadow.sm,
  padding: space.xl,
};

export const cardHover = {
  ...card,
  transition: 'all 0.2s',
  cursor: 'pointer',
  ':hover': {
    boxShadow: shadow.md,
    transform: 'translateY(-2px)',
    borderColor: colors.primary,
  },
};

export const btn = (variant = 'primary', size = 'md') => {
  const sizes = {
    sm: { padding: '0.4rem 0.8rem', fontSize: font.size.sm },
    md: { padding: '0.75rem 1.5rem', fontSize: font.size.md },
    lg: { padding: '1rem 2rem', fontSize: font.size.lg },
  };
  const variants = {
    primary: { bg: colors.primary, color: colors.white, border: 'none' },
    secondary: { bg: colors.white, color: colors.text, border: `1px solid ${colors.border}` },
    ghost: { bg: 'transparent', color: colors.primary, border: 'none' },
    danger: { bg: colors.danger, color: colors.white, border: 'none' },
  };
  return {
    ...sizes[size],
    ...variants[variant],
    borderRadius: radius.md,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: font.sans,
  };
};

export const badge = (color = 'primary') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.2rem 0.6rem',
  borderRadius: radius.full,
  fontSize: font.size.xs,
  fontWeight: 600,
  background: colors[`${color}Light`] || colors.primaryLight,
  color: colors[color] || colors.primary,
});

export const input = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  fontSize: font.size.md,
  fontFamily: font.sans,
  outline: 'none',
  transition: 'all 0.15s',
  background: colors.white,
};

export const inputFocus = {
  borderColor: colors.primary,
  boxShadow: `0 0 0 3px ${colors.primaryLight}`,
};

// === REUSABLE COMPONENTS ===

export function Logo({ size = 'md' }) {
  const sz = size === 'sm' ? '1.2rem' : size === 'lg' ? '2rem' : '1.5rem';
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: sz, fontWeight: 800, color: colors.text}}>
      <span style={{color: colors.primary}}>🩺</span>
      <span>FindMy<span style={{color: colors.primary}}>Doctor</span>.ae</span>
    </div>
  );
}

export function Avatar({ name, src, size = 64, verified = false }) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{position: 'relative', display: 'inline-block', flexShrink: 0}}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, ${colors.primary} 0%, #00C6FF 100%)`,
        color: colors.white, fontSize: size * 0.36, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: shadow.md,
      }}>
        {!src && initials}
      </div>
      {verified && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3,
          borderRadius: '50%', background: colors.success,
          color: colors.white, fontSize: size * 0.18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${colors.white}`,
        }}>✓</div>
      )}
    </div>
  );
}

export function Badge({ children, color = 'primary' }) {
  return <span style={badge(color)}>{children}</span>;
}

export function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled, href, fullWidth }) {
  const style = { ...btn(variant, size), ...(fullWidth ? { width: '100%', justifyContent: 'center' } : {}), ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}) };
  if (href) {
    return <a href={href} style={{...style, textDecoration: 'none'}}>{children}</a>;
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

export function Card({ children, style, hover, onClick }) {
  const base = hover ? cardHover : card;
  return <div onClick={onClick} style={{ ...base, ...style }}>{children}</div>;
}

export function StatCard({ label, value, icon, color = 'primary', sub }) {
  return (
    <Card style={{padding: space.lg}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
        <div style={{fontSize: font.size.sm, color: colors.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</div>
        {icon && <div style={{fontSize: '1.5rem', opacity: 0.7}}>{icon}</div>}
      </div>
      <div style={{fontSize: font.size.display, fontWeight: 800, color: colors.text, lineHeight: 1.1}}>{value}</div>
      {sub && <div style={{fontSize: font.size.sm, color: colors.textMuted, marginTop: '0.5rem'}}>{sub}</div>}
    </Card>
  );
}

export function ProgressBar({ value, color }) {
  const c = value < 30 ? colors.danger : value < 70 ? colors.warning : colors.success;
  return (
    <div style={{width: '100%', height: '8px', background: colors.bgSubtle, borderRadius: radius.full, overflow: 'hidden'}}>
      <div style={{height: '100%', width: `${value}%`, background: c, transition: 'width 0.3s', borderRadius: radius.full}}/>
    </div>
  );
}

export function Header({ user, currentPath = '/' }) {
  const router = typeof window !== 'undefined' ? require('next/router').useRouter() : null;
  return (
    <header style={{
      width: '100%',
      background: colors.white,
      borderBottom: `1px solid ${colors.borderLight}`,
      padding: `${space.md} ${space.xl}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <a href="/" style={{textDecoration: 'none'}}><Logo /></a>
      <nav style={{display: 'flex', alignItems: 'center', gap: space.lg}}>
        <a href="/" style={{color: currentPath === '/' ? colors.primary : colors.textMuted, textDecoration: 'none', fontWeight: 500}}>Médecins</a>
        <a href="https://findmydentist.ae/" style={{color: colors.textMuted, textDecoration: 'none', fontWeight: 500}}>Dentistes</a>
        <a href="/dashboard" style={{color: currentPath.startsWith('/dashboard') ? colors.primary : colors.textMuted, textDecoration: 'none', fontWeight: 500}}>Espace médecin</a>
        {user ? (
          <div style={{display: 'flex', alignItems: 'center', gap: space.sm}}>
            <Badge color={user.plan === 'premium' ? 'premium' : 'free'}>{user.plan || 'free'}</Badge>
            <Button variant="ghost" size="sm" onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/';
            }}>Déconnexion</Button>
          </div>
        ) : (
          <Button href="/dashboard/login" variant="primary" size="sm">Connexion</Button>
        )}
      </nav>
    </header>
  );
}
