import { useState } from 'react';
import Search from '../../../../shared/components/search/search';
import useDebounce from '../../../../shared/hooks/debounce/debounce';
import VendorList from '../vendor-list/vendor-list';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  console.log(debouncedSearchTerm);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
      <Search
        placeholder="Search vendors..."
        ariaLabel="search vendors"
        name="discovery-search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <VendorList />
    </section>
  );
}
