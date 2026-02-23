import Link from 'next/link';

export default function Home() {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
        <div style={{ marginBottom: '4rem' }}>
          <span style={{
            color: 'var(--primary)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: '0.875rem',
            display: 'block',
            marginBottom: '1rem'
          }}>
            Welcome to the Elite
          </span>
          <h1 className="heading" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '1.5rem' }}>
            kbank.
          </h1>
          <p className="subheading" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            A fusion of sophisticated technology and personal banking excellence.
            Designed for those who demand more from their financial interface.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link href="/login">
              <button className="btn btn-primary" style={{ padding: '1.25rem 3rem' }}>
                Enter Vault
              </button>
            </Link>
            <Link href="/register">
              <button className="btn btn-secondary" style={{ padding: '1.25rem 3rem' }}>
                Join the Circle
              </button>
            </Link>
          </div>
        </div>

        <div style={{
          marginTop: '6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '600' }}>Uncompromising Security</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Multi-layered encryption protocols designed for the modern financial landscape.</p>
          </div>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '600' }}>Instant Velocity</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Experience real-time transaction speeds that keep pace with your lifestyle.</p>
          </div>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '600' }}>Pure Elegance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>A minimal, distraction-free interface crafted for clarity and control.</p>
          </div>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '1.5rem' }}>◈</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '600' }}>Global Reach</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Access your assets from anywhere in the world with zero friction.</p>
          </div>
        </div>

        <footer style={{
          marginTop: '8rem',
          padding: '2rem 0',
          borderTop: '1px solid var(--glass-border)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          &copy; {new Date().getFullYear()} kbank private client services. all rights reserved.
        </footer>
      </div>
    </div>
  );
}
