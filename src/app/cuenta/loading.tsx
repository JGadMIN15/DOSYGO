export default function Loading() {
  return (
    <div style={{ background: "linear-gradient(180deg,#0d0d13,#08080b)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
        <div className="skeleton h-9 w-56 mb-8" style={{ background: "#1c1c24" }} />
        <div className="skeleton h-36 rounded-2xl mb-5" style={{ background: "#15151c" }} />
        <div className="skeleton h-64 rounded-2xl mb-5" style={{ background: "#15151c" }} />
        <div className="skeleton h-40 rounded-2xl mb-5" style={{ background: "#15151c" }} />
        <div className="skeleton h-40 rounded-2xl" style={{ background: "#15151c" }} />
      </div>
    </div>
  );
}
