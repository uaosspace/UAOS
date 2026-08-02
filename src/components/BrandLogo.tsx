interface BrandLogoProps {
  className?: string
}

/**
 * Wordmark UAOS на білій скругленій підкладці — без invert,
 * щоб синьо-жовтий каск зберігав контраст на dark/light.
 */
export default function BrandLogo({className = ''}: BrandLogoProps) {
  return (
    <span className={`brand-logo-plate${className ? ` ${className}` : ''}`}>
      <img
        className="brand-logo"
        src="/logos/logo.png"
        alt=""
        width={220}
        height={72}
        decoding="async"
      />
    </span>
  )
}
