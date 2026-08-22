export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="card1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="card2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0F9DA8" />
        </linearGradient>
      </defs>

      <circle cx="240" cy="210" r="200" fill="url(#glow)" />

      {/* grid backdrop suggesting analysis / blueprint */}
      <g stroke="#CBD5E1" strokeWidth="1" opacity="0.5">
        <line x1="60" y1="80" x2="60" y2="360" />
        <line x1="140" y1="60" x2="140" y2="380" />
        <line x1="420" y1="80" x2="420" y2="340" />
        <line x1="40" y1="120" x2="440" y2="120" />
        <line x1="40" y1="300" x2="440" y2="300" />
      </g>

      {/* central building / wall being analyzed */}
      <rect x="150" y="120" width="180" height="200" rx="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="172" y="150" width="46" height="46" rx="8" fill="url(#card2)" opacity="0.85" />
      <rect x="228" y="150" width="46" height="46" rx="8" fill="#E2E8F0" />
      <rect x="284" y="150" width="26" height="46" rx="8" fill="#E2E8F0" />
      <rect x="172" y="206" width="138" height="18" rx="6" fill="#E2E8F0" />
      <rect x="172" y="232" width="98" height="18" rx="6" fill="#E2E8F0" />
      <rect x="172" y="258" width="120" height="60" rx="8" fill="url(#card1)" opacity="0.12" />

      {/* scanning line, suggests AI analysis */}
      <rect x="150" y="196" width="180" height="4" rx="2" fill="#0EA5E9">
        <animate attributeName="y" values="130;300;130" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3.2s" repeatCount="indefinite" />
      </rect>

      {/* floating tech chips */}
      <g>
        <rect x="30" y="150" width="108" height="72" rx="16" fill="url(#card1)" />
        <circle cx="56" cy="176" r="8" fill="white" opacity="0.9" />
        <rect x="72" y="171" width="50" height="6" rx="3" fill="white" opacity="0.8" />
        <rect x="56" y="196" width="66" height="6" rx="3" fill="white" opacity="0.5" />
      </g>

      <g>
        <rect x="336" y="230" width="118" height="82" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="365" cy="258" r="10" fill="#16A34A" />
        <path d="M360 258l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="384" y="253" width="52" height="6" rx="3" fill="#CBD5E1" />
        <rect x="356" y="278" width="80" height="6" rx="3" fill="#E2E8F0" />
        <rect x="356" y="290" width="60" height="6" rx="3" fill="#E2E8F0" />
      </g>

      <g>
        <circle cx="80" cy="300" r="34" fill="url(#card2)" opacity="0.9" />
        <path
          d="M80 284c9 0 16 8 16 17 0 9-7 15-16 15s-16-6-16-15c0-9 7-17 16-17z"
          fill="white"
          opacity="0.9"
        />
      </g>

      <g opacity="0.9">
        <circle cx="410" cy="120" r="22" fill="#172554" />
        <path d="M401 120l6 6 12-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* drips referencing paint, kept abstract */}
      <path d="M108 96c0 10-8 14-8 22a8 8 0 0016 0c0-8-8-12-8-22z" fill="#0EA5E9" opacity="0.8" />
      <path d="M356 92c0 8-6 11-6 18a6 6 0 0012 0c0-7-6-10-6-18z" fill="#2563EB" opacity="0.7" />
    </svg>
  )
}
