const BankLogos: Record<string, React.FC<{ className?: string }>> = {
  nubank: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#820AD1" />
      <path d="M12 26V18.5L20 26H28V14L20 14V21.5L12 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  inter: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#FF7A00" />
      <text x="20" y="25" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16" fontFamily="Arial">i</text>
    </svg>
  ),
  itau: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#003399" />
      <rect x="10" y="8" width="20" height="24" rx="3" fill="#FF6600" />
      <text x="20" y="25" textAnchor="middle" fill="#003399" fontWeight="bold" fontSize="11" fontFamily="Arial">Itaú</text>
    </svg>
  ),
  bradesco: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#CC092F" />
      <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  bb: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#FFCB05" />
      <text x="20" y="26" textAnchor="middle" fill="#003882" fontWeight="bold" fontSize="14" fontFamily="Arial">BB</text>
    </svg>
  ),
  caixa: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#005CA9" />
      <path d="M14 16L20 12L26 16L20 20L14 16Z" fill="#F79520" />
      <path d="M14 24L20 20L26 24L20 28L14 24Z" fill="white" />
    </svg>
  ),
  santander: ({ className }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="20" fill="#EC0000" />
      <path d="M15 24C15 20 17.5 16 20 14C22.5 16 25 20 25 24" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 24C12 20 16 15 20 12C24 15 28 20 28 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
};

export default BankLogos;
