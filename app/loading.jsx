export default function RootLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg, #08110d)"
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "3px solid rgba(145, 212, 168, 0.15)",
        borderTopColor: "var(--mint, #91d4a8)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
