export default function Alert({ children }) {
  return (
    <div
      role="alert"
      className="absolute-center bg-white text-black text-center font-semibold py-2 px-3 rounded-sm"
    >
      {children}
    </div>
  );
}
