import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        cname: '',
        email: '',
        password: '',
        pin: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.pin.length !== 6 || isNaN(formData.pin)) {
            setError('PIN must be exactly 6 digits');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            router.push('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="card auth-card">
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
                        Elite Membership
                    </div>
                    <h1 className="heading" style={{ fontSize: '2.5rem' }}>kbank.</h1>
                    <p className="subheading" style={{ margin: '0' }}>Begin your elite financial journey</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Full Name"
                            value={formData.cname}
                            onChange={(e) => setFormData({ ...formData, cname: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Security PIN</label>
                            <input
                                type="text"
                                maxLength="6"
                                className="input-field"
                                placeholder="123456"
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Initializing...' : 'Complete Registration'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link href="/login" className="link-text" style={{ display: 'inline' }}>
                        Already a member? <span style={{ textDecoration: 'underline' }}>Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
