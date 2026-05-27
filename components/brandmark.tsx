interface BrandmarkProps {
  size?: number | string;
  fill?: string;
  className?: string;
}

export function Brandmark({ size = 32, fill = "currentColor", className }: BrandmarkProps) {
  return (
    <svg
      viewBox="0 0 884 886"
      width={size}
      height={size}
      fill={fill}
      className={className}
      aria-hidden="true"
    >
      <path d="M884 0H580.125L475.15 104.975V408.85H779.025L884 302.033V0Z" />
      <path d="M232.05 0H103.133L0 108.658V884L784.55 885.842L884 782.708V653.792H233.892L232.05 0Z" />
    </svg>
  );
}
