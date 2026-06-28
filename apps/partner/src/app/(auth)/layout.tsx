export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 0%, #4c1d95 0%, #2e1065 30%, #0f0f0f 70%)',
      }}
    >
      {children}
    </div>
  )
}
