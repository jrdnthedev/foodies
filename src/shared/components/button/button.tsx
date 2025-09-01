export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
    >
      {children}
    </button>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}
