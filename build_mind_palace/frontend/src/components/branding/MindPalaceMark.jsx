export default function MindPalaceMark({
  size = 32,
  framed = true,
  title = '',
  className = '',
}) {
  const radius = framed ? Math.max(8, Math.round(size * 0.28)) : Math.max(6, Math.round(size * 0.18));

  return (
    <img
      src="/mind-palace-icon-purple.png"
      width={size}
      height={size}
      className={className}
      alt={title}
      aria-hidden={title ? undefined : true}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        objectPosition: 'center',
        borderRadius: radius,
        boxShadow: framed ? '0 8px 18px rgba(81, 65, 136, 0.18)' : undefined,
      }}
      draggable={false}
    />
  );
}
