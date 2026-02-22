// Logos oficiais dos bancos brasileiros em SVG inline
const BankLogos: Record<string, React.FC<{ className?: string }>> = {
  nubank: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#820AD1" />
      <g transform="translate(8, 10) scale(0.6)">
        <path d="M4 33V16.5L16.5 33H20.5V33H36V16.5L23.5 0H20.5V0H4V16.5" fill="none" stroke="white" strokeWidth="4" strokeLinejoin="round" />
        <path d="M4 0V16.5L20 33V16.5L4 0Z" fill="white" />
        <path d="M36 33V16.5L20 0V16.5L36 33Z" fill="white" />
      </g>
    </svg>
  ),
  inter: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#FF7A00" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="20" cy="20" r="3" fill="white" />
    </svg>
  ),
  itau: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#003399" />
      <rect x="9" y="7" width="22" height="26" rx="4" fill="#EC7000" />
      <text x="20" y="24.5" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10" fontFamily="Arial, sans-serif">Itaú</text>
    </svg>
  ),
  bradesco: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#CC092F" />
      <g transform="translate(20, 20)">
        <path d="M0,-11 C6.1,-11 11,-6.1 11,0 C11,6.1 6.1,11 0,11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M0,11 C-6.1,11 -11,6.1 -11,0 C-11,-6.1 -6.1,-11 0,-11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  ),
  bb: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#FEDD00" />
      <text x="20" y="26" textAnchor="middle" fill="#003882" fontWeight="900" fontSize="16" fontFamily="Arial, sans-serif">BB</text>
    </svg>
  ),
  caixa: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#005CA9" />
      <g transform="translate(20, 20)">
        <polygon points="0,-10 10,0 0,3 -10,0" fill="#F79520" />
        <polygon points="0,10 10,0 0,-3 -10,0" fill="white" />
      </g>
    </svg>
  ),
  santander: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#EC0000" />
      <g transform="translate(20, 22)">
        <path d="M0,-12 C2,0 4,2 0,8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M0,-12 C-2,0 -4,2 0,8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M-10,-4 C-4,-6 -2,-4 0,8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M10,-4 C4,-6 2,-4 0,8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  ),
  mercadopago: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#00B1EA" />
      <g transform="translate(8, 12) scale(0.6)">
        <path d="M20 0C8.96 0 0 5.37 0 12C0 18.63 8.96 24 20 24C31.04 24 40 18.63 40 12C40 5.37 31.04 0 20 0Z" fill="white" />
        <path d="M20 4C12.27 4 6 7.58 6 12C6 16.42 12.27 20 20 20C27.73 20 34 16.42 34 12C34 7.58 27.73 4 20 4Z" fill="#00B1EA" />
      </g>
    </svg>
  ),
  picpay: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="8" fill="#21C25E" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="bold" fontSize="11" fontFamily="Arial, sans-serif">PIC</text>
    </svg>
  ),
};

export default BankLogos;
