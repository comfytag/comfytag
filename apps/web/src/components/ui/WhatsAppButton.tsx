import { WHATSAPP_GREEN } from '@comfytag/utils'

export interface WhatsAppButtonProps {
  href: string
  label?: string
  fullWidth?: boolean
}

export function WhatsAppButton({ href, label = 'Contact on WhatsApp', fullWidth = false }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '11px 16px',
        backgroundColor: WHATSAPP_GREEN,
        color: '#ffffff',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        width: fullWidth ? '100%' : 'auto',
        transition: 'opacity 150ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.opacity = '1'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.052 0-2.082.398-2.847 1.12-.735.71-1.14 1.656-1.14 2.66 0 1.04.415 2.049 1.143 2.821 1.488 1.595 4.223 2.765 6.861 2.765 1.052 0 2.082-.398 2.847-1.122.735-.71 1.141-1.656 1.141-2.66 0-1.04-.415-2.049-1.143-2.821-.073-.078-.147-.155-.223-.23C15.926 8.38 14.636 7.979 13.051 7.979M23.357 0H.643C.287 0 0 .287 0 .643v22.714c0 .356.287.643.643.643h22.714c.356 0 .643-.287.643-.643V.643c0-.356-.287-.643-.643-.643" />
      </svg>
      {label}
    </a>
  )
}
