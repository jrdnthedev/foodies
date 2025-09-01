import { useParams } from 'react-router-dom';
import useFetchVendors from '../../services/useFetchVendors';
import { useEffect, useState } from 'react';
import type { Vendor } from '../../entities/vendor';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import Link from '../../../../shared/components/link/link';
import ButtonContainer from '../button-container/button-container';

export default function Profile() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { fetchVendorById } = useFetchVendors({ autoFetch: false }); // Don't auto-fetch all vendors
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVendor = async () => {
      if (!vendorId) {
        setError('No vendor ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const vendorData = await fetchVendorById(vendorId);
        if (vendorData) {
          setVendor(vendorData);
        } else {
          setError('Vendor not found');
        }
      } catch (err) {
        setError('Failed to load vendor information');
        console.error('Error loading vendor:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [vendorId, fetchVendorById]);

  if (loading) {
    return <LoadingStencil />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Link
          path="/vendor-dashboard"
          styles="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Go Back
        </Link>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Link
          path="/vendor-dashboard"
          styles="inline-flex items-center text-blue-500 hover:text-blue-700 font-medium"
        >
          ← Back to Vendors
        </Link>
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <ButtonContainer vendorId={vendor.id} />
      </div>

      {/* Banner Section*/}
      <div className="rounded-lg">
        <img src="/salad.jpg" alt={`${vendor.name} banner`} />
      </div>

      {/* Vendor Details */}
      <div className="flex flex-col gap-2">
        <p className="text-lg text-gray-600">{vendor.type}</p>
        <p className="text-gray-500">{vendor.location.address}</p>
        {vendor.claimedBy && (
          <p className="text-sm text-green-600">✓ Claimed by {vendor.claimedBy}</p>
        )}
      </div>

      {/* Social Links */}
      {(vendor.socialLinks.instagram ||
        vendor.socialLinks.twitter ||
        vendor.socialLinks.facebook ||
        vendor.socialLinks.website) && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Social Links</h2>
          <div className="flex gap-4">
            {vendor.socialLinks.instagram && (
              <a
                href={vendor.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Instagram
              </a>
            )}
            {vendor.socialLinks.twitter && (
              <a
                href={vendor.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Twitter
              </a>
            )}
            {vendor.socialLinks.facebook && (
              <a
                href={vendor.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Facebook
              </a>
            )}
            {vendor.socialLinks.website && (
              <a
                href={vendor.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Schedule Section*/}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Schedule</h2>
        {vendor.schedule.length > 0 ? (
          <div className="flex flex-col gap-2">
            {vendor.schedule.map((schedule, index) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold">
                  {schedule.date} at {schedule.location}
                </h3>
                <p className="text-sm text-gray-500">
                  {schedule.startTime} - {schedule.endTime}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">No scheduled events</p>
          </div>
        )}
      </div>
    </section>
  );
}
