type SpinnerProps = { className?: string; label?: string; size?: number };

function Spinner({
  className = "",
  label = "Loading",
  size = 40,
}: SpinnerProps) {
  return (
    <div
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-4 border-outline-variant border-t-primary ${className}`}
      role="status"
      style={{ height: size, width: size }}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Spinner;
