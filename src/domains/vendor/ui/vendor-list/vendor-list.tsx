import Card from '../../../../shared/components/card/card';
import Link from '../../../../shared/components/link/link';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import type { Vendor } from '../../entities/vendor';
import useFetchVendors from '../../services/useFetchVendors';

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
          {vendors.map((vendor: Vendor) => (
            <li key={vendor.id}>
              <Card>
                <Link
                  path={`/vendor/${vendor.id}`}
                  styles="block hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="rounded-lg">
                    <img src="/salad.jpg" alt="Banner" />
                  </div>
                  <h3 className="text-xl font-bold">{vendor.name}</h3>
                  <p className="text-sm text-gray-500">{vendor.type}</p>
                  <p className="text-sm text-gray-500">{vendor.location.address}</p>
                </Link>
              </Card>
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
