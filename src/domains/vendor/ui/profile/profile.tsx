export default function Profile() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Name</h1>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent">
          Following
        </button>
      </div>

      {/* Banner Section*/}
      <div className="rounded-lg">
        <img src="/salad.jpg" alt="Banner" />
      </div>
      {/* Schedule Section*/}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Schedule</h2>
        <div className="flex flex-col gap-2 border-b border-gray-200 pb-2">
          <p className="text-sm text-gray-500">updated 20 minutes ago</p>
          <h3>Tuesday, April 16th Downtown Park</h3>
          <p className="text-sm text-gray-500">11:30 AM - 1:30 PM</p>
          <p className="text-sm text-gray-500">No other events scheduled</p>
        </div>
        {/* <p>
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
              )} */}
      </div>
    </section>
  );
}
