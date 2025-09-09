import { useCallback, useState } from 'react';
import Card from '../../../../shared/components/card/card';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import type { Vendor } from '../../entities/vendor';
import { useVendorStore } from '../../state/state';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../../../../shared/hooks/debounce/debounce';
import Search from '../../../../shared/components/search/search';

export default function VendorList() {
  const { followedVendors, isLoading, error, selectVendor } = useVendorStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleVendorClick = useCallback(
    (vendor: Vendor) => {
      selectVendor(vendor);
      navigate(`/vendor/${vendor.id}`);
    },
    [selectVendor]
  );

  if (isLoading) {
    return <LoadingStencil />;
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <Search
        placeholder="Search vendors..."
        ariaLabel="search vendors"
        name="discovery-search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {followedVendors.length === 0 ? (
        <Card>
          <p>No vendors found.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {followedVendors
            .filter(
              (vendor: Vendor) =>
                debouncedSearchTerm === '' ||
                vendor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            )
            .map((vendor: Vendor) => {
              const scheduleCount = vendor.schedule?.length || 0;
              const hasSchedules = scheduleCount > 0;
              return (
                <li key={vendor.id}>
                  <Card>
                    <button
                      onClick={() => handleVendorClick(vendor)}
                      className="block hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="rounded-lg">
                        <img src="/salad.jpg" alt="Banner" />
                      </div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">{vendor.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hasSchedules
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {hasSchedules
                            ? `${scheduleCount} schedule${scheduleCount !== 1 ? 's' : ''}`
                            : 'No schedules'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">{vendor.type}</p>
                      <p className="text-sm text-gray-500">
                        <span>📍</span>
                        {vendor.location.address}
                      </p>
                      {hasSchedules && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Recent Activity</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      )}
                    </button>
                  </Card>
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
}
