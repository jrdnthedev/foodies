export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="shadow-md border border-gray-900/10 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 flex-1 relative transition-colors">
      {children}
    </div>
  );
}
