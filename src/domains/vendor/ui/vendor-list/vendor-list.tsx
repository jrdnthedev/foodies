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
              <h3>{vendor.name}</h3>
              <p>
                <strong>Type:</strong> {vendor.type}
              </p>
              <p>
                <strong>Address:</strong> {vendor.location.address}
              </p>
              <p>
                <strong>Claimed:</strong> {vendor.claimedBy ? 'Yes' : 'No'}
              </p>

              {vendor.socialLinks.instagram && (
                <p>
                  <strong>Instagram:</strong>{' '}
                  <a href={vendor.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    @{vendor.socialLinks.instagram}
                  </a>
                </p>
              )}

              {vendor.schedule.length > 0 && (
                <div>
                  <strong>Schedule:</strong>
                  <ul>
                    {vendor.schedule.map((schedule, index) => (
                      <li key={index}>
                        {schedule.date}: {schedule.startTime} - {schedule.endTime} at{' '}
                        {schedule.location}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}

          {pagination && (
            <div>
              <p>
                Page {pagination.page} of {pagination.totalPages}({pagination.total} total vendors)
              </p>
            </div>
          )}
        </ul>
      )}
    </>
  );
}
