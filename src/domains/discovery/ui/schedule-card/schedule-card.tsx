import type { Schedule } from '../../../vendor/entities/schedule';

interface ScheduleCardProps {
  schedule: Schedule;
  showConfidence?: boolean;
  showSource?: boolean;
  className?: string;
  onClick?: (schedule: Schedule) => void;
}

export function ScheduleCard({
  schedule,
  showConfidence = true,
  showSource = false,
  className = '',
  onClick,
}: ScheduleCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(schedule);
    }
  };
  return (
    <div
      className={`hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {/* Date */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{formatDate(schedule.date)}</h3>
        {showConfidence && (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(schedule.confidence)}`}
          >
            {getConfidenceLabel(schedule.confidence)} ({Math.round(schedule.confidence * 100)}%)
          </span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center mb-2 text-gray-600">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm">
          {schedule.startTime} - {schedule.endTime}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center mb-3 text-gray-600">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-sm">{schedule.location}</span>
      </div>

      {/* Source (optional) */}
      {showSource && (
        <div className="text-xs text-gray-500 border-t pt-2">Source: {schedule.source}</div>
      )}

      {/* Updated timestamp */}
      {schedule.updatedAt && (
        <div className="text-xs text-gray-400 mt-2">
          Updated: {new Date(schedule.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
