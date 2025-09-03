import { useParams } from 'react-router-dom';
import useFetchVendors from '../../../vendor/services/useFetchVendors';
import { useEffect, useState } from 'react';
import type { Vendor } from '../../../vendor/entities/vendor';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import Link from '../../../../shared/components/link/link';
import ButtonContainer from '../../../vendor/ui/button-container/button-container';
import { useScheduleCrawler } from '../../services/useScheduleCrawler';
import { ScheduleCard } from '../schedule-card/schedule-card';
import Card from '../../../../shared/components/card/card';

export default function Profile() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { fetchVendorById } = useFetchVendors({ autoFetch: false }); // Don't auto-fetch all vendors
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const previousPagePath = '/discovery';
  const { schedules, loadAnalytics } = useScheduleCrawler();

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
          path={previousPagePath}
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
          path={previousPagePath}
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
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Schedule</h2>
          <button
            onClick={() => loadAnalytics(vendor.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
          >
            🔍 Find Latest Schedules
          </button>
        </div>

        {/* Stored/Confirmed Schedules */}
        {vendor.schedule.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📅 Confirmed Schedule{vendor.schedule.length !== 1 ? 's' : ''} (
              {vendor.schedule.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendor.schedule.map((schedule, index) => {
                console.log(schedule);
                return (
                  <Card key={`confirmed-${schedule.vendorId}-${schedule.date}-${index}`}>
                    <ScheduleCard
                      schedule={schedule}
                      showConfidence={true}
                      showSource={true}
                      onClick={() => console.log('clicked confirmed schedule')}
                    />
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Discovered/Live Schedules */}
        {schedules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔍 Recently Discovered ({schedules.length})
              <span className="text-sm font-normal text-gray-600 ml-2">
                From social media crawling
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule, index) => (
                <Card key={`discovered-${schedule.vendorId}-${schedule.date}-${index}`}>
                  <ScheduleCard
                    schedule={schedule}
                    showConfidence={true}
                    showSource={true}
                    onClick={() => console.log('clicked discovered schedule')}
                  />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {vendor.schedule.length === 0 && schedules.length === 0 && (
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">No scheduled events found</p>
            <p className="text-xs text-gray-400">
              Try clicking "Find Latest Schedules" to discover recent posts
            </p>
          </div>
        )}

        {/* Loading State for Discovery */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching for latest schedules...
            </div>
          </div>
        )}

        {/* Error State for Discovery */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm">Unable to discover latest schedules: {error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
