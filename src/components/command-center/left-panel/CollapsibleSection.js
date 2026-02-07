import { FaChevronDown } from 'react-icons/fa';

const VARIANT_STYLES = {
  default: {
    dark: { backgroundColor: '#1f2937' },
    light: { backgroundColor: '#f3f4f6' },
  },
  danger: {
    dark: { backgroundColor: '#7f1d1d', color: '#fca5a5' },
    light: { backgroundColor: '#fef2f2', color: '#b91c1c' },
  },
  warning: {
    dark: { backgroundColor: '#78350f', color: '#fcd34d' },
    light: { backgroundColor: '#fffbeb', color: '#b45309' },
  },
  success: {
    dark: { backgroundColor: '#1f2937' },
    light: { backgroundColor: '#f3f4f6' },
  },
};

const CollapsibleSection = ({ theme, title, count, isOpen, onToggle, variant = 'default', titleColor, countOpacity, children }) => {
  const variantStyle = VARIANT_STYLES[variant]?.[theme] || VARIANT_STYLES.default[theme];
  const opac = countOpacity ?? (variant === 'default' || variant === 'success' ? 0.6 : 0.8);

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '13px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          ...variantStyle,
        }}
      >
        <FaChevronDown style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: '10px' }} />
        <span style={titleColor ? { color: titleColor } : undefined}>{title}</span>
        <span style={{ marginLeft: 'auto', opacity: opac, fontSize: '12px' }}>
          {count}
        </span>
      </div>
      {isOpen && children}
    </>
  );
};

export default CollapsibleSection;
