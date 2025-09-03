import Card from '../../../../shared/components/card/card';
import Link from '../../../../shared/components/link/link';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import type { Vendor } from '../../../vendor/entities/vendor';
import useFetchVendors from '../../../vendor/services/useFetchVendors';

export default function VendorList() {
  const { vendors, loading, error, pagination, refetch } = useFetchVendors({
    page: 1,
    limit: 10,
  });

  if (loading) {
    return <LoadingStencil />;
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
        <Card>
          <p>No vendors found.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {vendors.map((vendor: Vendor) => {
            const scheduleCount = vendor.schedule?.length || 0;
            const hasSchedules = scheduleCount > 0;
            return (
              <li key={vendor.id}>
                <Card>
                  <Link
                    path={`/vendor/${vendor.id}`}
                    styles="block hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="rounded-lg">
                      <img src="/salad.jpg" alt="Banner" />
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">{vendor.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hasSchedules ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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
                  </Link>
                </Card>
              </li>
            );
          })}

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
