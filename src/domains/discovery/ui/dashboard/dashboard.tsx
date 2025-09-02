import { useState } from 'react';
import Search from '../../../../shared/components/search/search';
import useDebounce from '../../../../shared/hooks/debounce/debounce';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  console.log(debouncedSearchTerm);
  return (
    <section className="flex flex-col gap-4">
      <h1>Dashboard</h1>
      <Search
        placeholder="test"
        ariaLabel="search vendors"
        name="discovery-search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </section>
  );
}
