import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Sending login request...');
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            console.log('Login response:', data);

            if (!res.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            alert('Login successful! Redirecting to dashboard...');
            router.push('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="card auth-card shadow-2xl">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        borderRadius: '100px',
                        background: 'rgba(250, 204, 21, 0.1)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '1rem'
                    }}>
                        Secure Access
                    </div>
                    <h1 className="heading" style={{ fontSize: '2.5rem' }}>kbank.</h1>
                    <p className="subheading" style={{ margin: '0' }}>Welcome back to your elite vault</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Vault Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Master Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Unlock Account'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link href="/register" className="link-text" style={{ display: 'inline' }}>
                        Not a member? <span style={{ textDecoration: 'underline' }}>Create Account</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
