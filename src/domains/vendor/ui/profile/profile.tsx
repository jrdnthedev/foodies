import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoadingStencil from '../../../../shared/components/loading-stencil/loading-stencil';
import Link from '../../../../shared/components/link/link';
import { useScheduleCrawler } from '../../../discovery/services/useScheduleCrawler';
import { ScheduleCard } from '../../../discovery/ui/schedule-card/schedule-card';
import Card from '../../../../shared/components/card/card';
import FollowContainer from '../../../../shared/components/follow-container/follow-container';
import { useVendorStore } from '../../state/state';

export default function Profile() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { selectedVendor, selectVendorById, isLoading } = useVendorStore();
  const [error, setError] = useState<string | null>(null);
  const previousPagePath = '/vendor-dashboard';
  const { schedules, loadAnalytics } = useScheduleCrawler();

  useEffect(() => {
    const loadVendor = async () => {
      if (!vendorId) {
        setError('No vendor ID provided');
        return;
      }

      // If we don't have the selected vendor or it's different from the URL param
      if (!selectedVendor || selectedVendor.id !== vendorId) {
        try {
          await selectVendorById(vendorId);
        } catch (err) {
          setError('Failed to load vendor information');
          console.error('Error loading vendor:', err);
        }
      }
    };

    loadVendor();
  }, [vendorId, selectedVendor, selectVendorById]);

  if (isLoading) {
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

  if (!selectedVendor) {
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
        <h1 className="text-2xl font-bold">{selectedVendor.name}</h1>
        <FollowContainer vendor={selectedVendor} />
      </div>

      {/* Banner Section*/}
      <div className="rounded-lg">
        <img src="/salad.jpg" alt={`${selectedVendor.name} banner`} />
      </div>

      {/* Vendor Details */}
      <div className="flex flex-col gap-2">
        <p className="text-lg text-gray-600">{selectedVendor.type}</p>
        <p className="text-gray-500">{selectedVendor.location.address}</p>
        {selectedVendor.claimedBy && (
          <p className="text-sm text-green-600">✓ Claimed by {selectedVendor.claimedBy}</p>
        )}
      </div>

      {/* Social Links */}
      {(selectedVendor.socialLinks.instagram ||
        selectedVendor.socialLinks.twitter ||
        selectedVendor.socialLinks.facebook ||
        selectedVendor.socialLinks.website) && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Social Links</h2>
          <div className="flex gap-4">
            {selectedVendor.socialLinks.instagram && (
              <a
                href={selectedVendor.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Instagram
              </a>
            )}
            {selectedVendor.socialLinks.twitter && (
              <a
                href={selectedVendor.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Twitter
              </a>
            )}
            {selectedVendor.socialLinks.facebook && (
              <a
                href={selectedVendor.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Facebook
              </a>
            )}
            {selectedVendor.socialLinks.website && (
              <a
                href={selectedVendor.socialLinks.website}
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
            onClick={() => loadAnalytics(selectedVendor.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
          >
            🔍 Find Latest Schedules
          </button>
        </div>

        {/* Stored/Confirmed Schedules */}
        {selectedVendor.schedule.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📅 Confirmed Schedule{selectedVendor.schedule.length !== 1 ? 's' : ''} (
              {selectedVendor.schedule.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedVendor.schedule.map((schedule, index) => {
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
        {selectedVendor.schedule.length === 0 && schedules.length === 0 && (
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">No scheduled events found</p>
            <p className="text-xs text-gray-400">
              Try clicking "Find Latest Schedules" to discover recent posts
            </p>
          </div>
        )}

        {/* Loading State for Discovery */}
        {isLoading && (
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
