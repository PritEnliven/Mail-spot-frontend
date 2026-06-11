const AppLoader = () => (
    <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        zIndex: 9999,
    }}>
        <div style={{
            width: 60,
            height: 60,
            border: '3px solid #e0e0e0',
            borderTop: '3px solid #4a90e2',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

export default AppLoader;