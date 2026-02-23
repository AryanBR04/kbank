import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ChatWidget from '../components/ChatWidget';

export default function Dashboard() {
    const router = useRouter();
    const [balance, setBalance] = useState(null);
    const [cname, setCname] = useState('');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    // PIN Modal State (for balance reveal)
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [checkingBalance, setCheckingBalance] = useState(false);

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({
        recipientEmail: '',
        amount: '',
        pin: '',
        description: ''
    });
    const [transferError, setTransferError] = useState('');
    const [processingTransfer, setProcessingTransfer] = useState(false);

    // Deposit Modal State
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositData, setDepositData] = useState({
        amount: '',
        pin: '',
        description: ''
    });
    const [depositError, setDepositError] = useState('');
    const [processingDeposit, setProcessingDeposit] = useState(false);

    // Security Settings Modal State
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityTab, setSecurityTab] = useState('pin'); // 'pin' or 'password'
    const [securityData, setSecurityData] = useState({
        currentPin: '',
        newPin: '',
        currentPassword: '',
        newPassword: ''
    });
    const [securityError, setSecurityError] = useState('');
    const [securitySuccess, setSecuritySuccess] = useState('');
    const [updatingSecurity, setUpdatingSecurity] = useState(false);

    const [cid, setCid] = useState(null);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
    };

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/balance');
            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (res.ok) {
                setCname(data.cname);
                setCid(data.cid);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchTransactions();
    }, [router]);

    const handleCheckBalance = async (e) => {
        e.preventDefault();
        setPinError('');
        setCheckingBalance(true);

        try {
            const res = await fetch('/api/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            const data = await res.json();

            if (res.ok) {
                setBalance(data.balance);
                setShowPinModal(false);
                setPin('');
            } else {
                setPinError(data.message || 'Incorrect PIN');
            }
        } catch (err) {
            setPinError('Something went wrong');
        } finally {
            setCheckingBalance(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setTransferError('');
        setProcessingTransfer(true);

        try {
            const res = await fetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transferData)
            });

            const data = await res.json();

            if (res.ok) {
                setShowTransferModal(false);
                setTransferData({ recipientEmail: '', amount: '', pin: '', description: '' });
                if (balance !== null) {
                    const balRes = await fetch('/api/balance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: transferData.pin })
                    });
                    if (balRes.ok) {
                        const balData = await balRes.json();
                        setBalance(balData.balance);
                    }
                }
                fetchTransactions();
                alert('Transfer Successful');
            } else {
                setTransferError(data.message || 'Transfer failed');
            }
        } catch (err) {
            setTransferError('Connection error');
        } finally {
            setProcessingTransfer(false);
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setDepositError('');
        setProcessingDeposit(true);

        try {
            const res = await fetch('/api/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(depositData)
            });

            const data = await res.json();

            if (res.ok) {
                setShowDepositModal(false);
                setDepositData({ amount: '', pin: '', description: '' });
                if (balance !== null) {
                    const balRes = await fetch('/api/balance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: depositData.pin })
                    });
                    if (balRes.ok) {
                        const balData = await balRes.json();
                        setBalance(balData.balance);
                    }
                }
                fetchTransactions();
                alert('Deposit Successful');
            } else {
                setDepositError(data.message || 'Deposit failed');
            }
        } catch (err) {
            setDepositError('Connection error');
        } finally {
            setProcessingDeposit(false);
        }
    };

    const handleUpdateSecurity = async (e) => {
        e.preventDefault();
        setSecurityError('');
        setSecuritySuccess('');
        setUpdatingSecurity(true);

        const endpoint = securityTab === 'pin' ? '/api/auth/update-pin' : '/api/auth/update-password';
        const payload = securityTab === 'pin'
            ? { currentPin: securityData.currentPin, newPin: securityData.newPin }
            : { currentPassword: securityData.currentPassword, newPassword: securityData.newPassword };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setSecuritySuccess(data.message);
                setSecurityData({ currentPin: '', newPin: '', currentPassword: '', newPassword: '' });
                setTimeout(() => {
                    setShowSecurityModal(false);
                    setSecuritySuccess('');
                }, 2000);
            } else {
                setSecurityError(data.message || 'Update failed');
            }
        } catch (err) {
            setSecurityError('Connection error');
        } finally {
            setUpdatingSecurity(false);
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Securing Connection...
                </div>
            </div>
        );
    }

    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour >= 5 && hour < 12) greeting = 'Good Morning';
    else if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';

    return (
        <div className="page-wrapper" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '0' }}>
            {/* Status Bar */}
            <div style={{
                width: '100vw', padding: '0.75rem 0', background: 'rgba(255,255,255,0.01)',
                borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: '3rem'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    <span>System: Active</span>
                    <span>Session: Encrypted</span>
                    <span>Region: Private Cloud</span>
                </div>
            </div>

            <div className="container" style={{ width: '100%', maxWidth: '1200px' }}>
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="heading" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>kbank.</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em' }}>PRIVATE CLIENT SERVICES</p>
                    </div>
                    <button onClick={() => {
                        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        router.push('/login');
                    }} className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.875rem', borderRadius: '4px' }}>
                        Log Out
                    </button>
                </header>

                {/* Symmetrical Header Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: '700', letterSpacing: '-0.01em' }}>{greeting},</h2>
                        <span style={{ fontSize: '2.25rem', fontWeight: '400', color: 'var(--text-muted)' }}>{cname}</span>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1.25rem' }}>Quick Actions</h3>
                    </div>
                </div>

                {/* Main 1:1 Grid Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'stretch' }}>
                    {/* Left Card: Balance */}
                    <div className="card balance-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>Available Assets</p>
                            <h2 style={{ fontSize: '4rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1' }}>
                                {balance !== null ? `$${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                            </h2>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Member Signature</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '500', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'inline-block', paddingBottom: '4px' }}>
                                    {cname?.toUpperCase()}
                                </p>
                            </div>
                            {balance !== null ? (
                                <button className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.1em' }} onClick={() => setBalance(null)}>
                                    SECURE VAULT
                                </button>
                            ) : (
                                <button className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '0.75rem', letterSpacing: '0.1em' }} onClick={() => setShowPinModal(true)}>
                                    REVEAL BALANCE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Card: Actions */}
                    <div className="card action-container" style={{
                        padding: '3rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '380px'
                    }}>
                        <button className="btn btn-primary action-btn" onClick={() => setShowTransferModal(true)} style={{ height: '70px', fontSize: '1rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>↗</span> Initiate Transfer
                        </button>
                        <button className="btn btn-secondary action-btn" onClick={() => setShowDepositModal(true)} style={{ height: '70px', fontSize: '1rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>↓</span> Private Deposit
                        </button>
                        <button className="btn btn-secondary action-btn" onClick={() => setShowSecurityModal(true)} style={{ height: '70px', fontSize: '1rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>⚙</span> Security Center
                        </button>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', color: '#22c55e' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                                CONNECTION SECURE
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Symmetry Anchor: Activity Ledger */}
                <div style={{ marginTop: '5rem', marginBottom: '5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.02em' }}>Activity Ledger</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Verification</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {transactions.length === 0 ? (
                            <div className="card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
                                No transactions recorded in this session.
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.tid} className="card ledger-item" style={{
                                    padding: '1.75rem 2.5rem', background: 'rgba(255,255,255,0.015)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '12px',
                                            background: tx.type === 'debit' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: tx.type === 'debit' ? '#ef4444' : '#22c55e', fontSize: '1.5rem'
                                        }}>{tx.type === 'debit' ? '↗' : '↙'}</div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{tx.description}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                                                {tx.type === 'debit' ? `To: ${tx.receiver_name}` : `From: ${tx.sender_name || 'Private Deposit'}`} • {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '800', fontSize: '1.25rem', color: tx.type === 'debit' ? '#ef4444' : '#22c55e', letterSpacing: '-0.02em' }}>
                                            {tx.type === 'debit' ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Verified Transaction</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals - Staying consistent with premium look */}
            {showPinModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)', zIndex: 1000 }}>
                    <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', padding: '4rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '3rem', fontWeight: '800', letterSpacing: '0.05em' }}>IDENTIFICATION</h2>
                        <form onSubmit={handleCheckBalance}>
                            <input type="password" maxLength="6" className="input-field" placeholder="••••••" style={{ marginBottom: '2.5rem', textAlign: 'center', fontSize: '3rem', letterSpacing: '0.8rem', padding: '1.5rem', borderBottomWidth: '2px' }} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoFocus required />
                            {pinError && <div className="error-msg" style={{ marginBottom: '2rem' }}>{pinError}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ padding: '1.25rem' }} onClick={() => setShowPinModal(false)}>CANCEL</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem' }} disabled={checkingBalance}>ACCESS</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)', zIndex: 1000 }}>
                    <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '540px', padding: '4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>INITIATE TRANSFER</h2>
                            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '2rem' }}>×</button>
                        </div>
                        <form onSubmit={handleTransfer}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Recipient</label>
                                    <input type="email" className="input-field" placeholder="identity@kbank.com" value={transferData.recipientEmail} onChange={(e) => setTransferData({ ...transferData, recipientEmail: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Amount (USD)</label>
                                    <input type="number" step="0.01" className="input-field" placeholder="0.00" value={transferData.amount} onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Authorization PIN</label>
                                    <input type="password" maxLength="6" className="input-field" placeholder="••••••" value={transferData.pin} onChange={(e) => setTransferData({ ...transferData, pin: e.target.value.replace(/\D/g, '') })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Memo</label>
                                    <input type="text" className="input-field" placeholder="Optional description" value={transferData.description} onChange={(e) => setTransferData({ ...transferData, description: e.target.value })} />
                                </div>
                            </div>
                            {transferError && <div className="error-msg" style={{ marginTop: '2.5rem' }}>{transferError}</div>}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '3.5rem', padding: '1.5rem', fontSize: '1rem', fontWeight: '700' }} disabled={processingTransfer}>
                                AUTHORIZE SETTLEMENT
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDepositModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)', zIndex: 1000 }}>
                    <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '540px', padding: '4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>PRIVATE DEPOSIT</h2>
                            <button onClick={() => setShowDepositModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '2rem' }}>×</button>
                        </div>
                        <form onSubmit={handleDeposit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Value (USD)</label>
                                    <input type="number" step="0.01" className="input-field" placeholder="0.00" value={depositData.amount} onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Authorization PIN</label>
                                    <input type="password" maxLength="6" className="input-field" placeholder="••••••" value={depositData.pin} onChange={(e) => setDepositData({ ...depositData, pin: e.target.value.replace(/\D/g, '') })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.2em' }}>Source</label>
                                    <input type="text" className="input-field" placeholder="Optional description" value={depositData.description} onChange={(e) => setDepositData({ ...depositData, description: e.target.value })} />
                                </div>
                            </div>
                            {depositError && <div className="error-msg" style={{ marginTop: '2.5rem' }}>{depositError}</div>}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '3.5rem', padding: '1.5rem', fontSize: '1rem', fontWeight: '700' }} disabled={processingDeposit}>
                                CONFIRM DEPOSIT
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showSecurityModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)', zIndex: 1000 }}>
                    <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '500px', padding: '4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>SECURITY CENTER</h2>
                            <button onClick={() => { setShowSecurityModal(false); setSecurityError(''); setSecuritySuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '2rem' }}>×</button>
                        </div>

                        <div style={{
                            display: 'flex', background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px', padding: '6px', marginBottom: '3.5rem',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <button
                                onClick={() => { setSecurityTab('pin'); setSecurityError(''); setSecuritySuccess(''); }}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px', background: securityTab === 'pin' ? 'rgba(255,255,255,0.07)' : 'transparent',
                                    border: 'none', color: securityTab === 'pin' ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.3s'
                                }}
                            >SECURITY PIN</button>
                            <button
                                onClick={() => { setSecurityTab('password'); setSecurityError(''); setSecuritySuccess(''); }}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '8px', background: securityTab === 'password' ? 'rgba(255,255,255,0.07)' : 'transparent',
                                    border: 'none', color: securityTab === 'password' ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.3s'
                                }}
                            >ACCESS PASSWORD</button>
                        </div>

                        <form onSubmit={handleUpdateSecurity}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {securityTab === 'pin' ? (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>Current PIN</label>
                                            <input type="password" maxLength="6" className="input-field" placeholder="••••••" value={securityData.currentPin} onChange={(e) => setSecurityData({ ...securityData, currentPin: e.target.value.replace(/\D/g, '') })} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>New PIN</label>
                                            <input type="password" maxLength="6" className="input-field" placeholder="••••••" value={securityData.newPin} onChange={(e) => setSecurityData({ ...securityData, newPin: e.target.value.replace(/\D/g, '') })} required />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>Current Password</label>
                                            <input type="password" className="input-field" placeholder="••••••••" value={securityData.currentPassword} onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>New Password</label>
                                            <input type="password" className="input-field" placeholder="••••••••" value={securityData.newPassword} onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })} required />
                                        </div>
                                    </>
                                )}
                            </div>
                            {securityError && <div className="error-msg" style={{ marginTop: '2.5rem', textAlign: 'center' }}>{securityError}</div>}
                            {securitySuccess && <div style={{ color: '#22c55e', marginTop: '2.5rem', textAlign: 'center', fontWeight: '700' }}>{securitySuccess}</div>}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '4rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.5rem', fontWeight: '800' }} disabled={updatingSecurity}>
                                    {updatingSecurity ? 'UPDATING...' : 'CONFIRM CHANGES'}
                                </button>
                                <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '1rem', border: 'none' }} onClick={() => setShowSecurityModal(false)}>
                                    DISCARD
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ChatWidget userId={cid} />
            <style jsx>{`
                .action-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 8px !important; }
                .action-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important; filter: brightness(1.1); }
                .ledger-item { transition: all 0.2s ease; cursor: default; }
                .ledger-item:hover { transform: scale(1.01); background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.08) !important; }
            `}</style>
        </div>
    );
}
