import useFetchVendors from '../../services/useFetchVendors';

export default function VendorList() {
  const { vendors, loading, error, pagination, refetch } = useFetchVendors({
    page: 1,
    limit: 10,
  });

  if (loading) {
    return <div>Loading vendors...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <>
      {vendors.length === 0 ? (
        <p>No vendors found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <div className="rounded-lg">
                <img src="/salad.jpg" alt="Banner" />
              </div>
              <h3 className="text-xl font-bold">{vendor.name}</h3>
              <p className="text-sm text-gray-500">{vendor.type}</p>
              <p className="text-sm text-gray-500">{vendor.location.address}</p>
            </li>
          ))}

          {pagination && (
            <div>
              <p className="text-xs text-gray-500 italic">
                Page {pagination.page} of {pagination.totalPages}({pagination.total} total vendors)
              </p>
            </div>
          )}
        </ul>
      )}
    </>
  );
}
