export default function Search({
  placeholder,
  value,
  onChange,
  type,
  id,
  name,
  ariaLabel,
}: SearchProps) {
  return (
    <input
      className="w-full rounded-md border border-gray-300 px-3 py-2 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:border-transparent
        active:outline-none active:border-transparent
        cursor-pointer
        focus:border-transparent
        active:outline-none active:border-transparent
        cursor-pointer
        [-webkit-appearance:none]
        [&:-webkit-autofill]:bg-white
        [&:-webkit-autofill:focus]:bg-white
        [&:-webkit-autofill:active]:bg-white"
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      aria-label={ariaLabel}
    />
  );
}

interface SearchProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  id?: string;
  name: string;
  ariaLabel: string;
}
