import { useState } from 'react';
import type { SocialMediaSearchRequest } from '../../services/social-media-search.service';
import SearchingSpinner from '../../../../shared/components/searching-spinner/searching-spinner';

interface SocialMediaSearchProps {
  onSearch: (request: SocialMediaSearchRequest) => void;
  isSearching: boolean;
  placeholder?: string;
}

export function SocialMediaSearch({
  onSearch,
  isSearching,
  placeholder = 'Search for a business...',
}: SocialMediaSearchProps) {
  const [businessName, setBusinessName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'TWITTER',
    'INSTAGRAM',
    'REDDIT',
    'YOUTUBE',
  ]);
  const [searchType, setSearchType] = useState<'posts' | 'profiles'>('posts');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const platforms = [
    { id: 'TWITTER', name: 'Twitter/X', icon: '🐦' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📷' },
    { id: 'REDDIT', name: 'Reddit', icon: '🤖' },
    { id: 'YOUTUBE', name: 'YouTube', icon: '📺' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    onSearch({
      businessName: businessName.trim(),
      platforms: selectedPlatforms,
      searchType,
    });
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Business Name Input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="business-name" className="block text-sm font-medium text-gray-700">
            Business Name
          </label>
          <input
            id="business-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
        </div>

        {/* Search Type Selection */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            What are you looking for?
          </legend>
          <div className="flex flex-col gap-2" aria-labelledby="searchtype-legend">
            <div className="flex gap-2">
              <label
                className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                  searchType === 'posts'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="searchType"
                  value="posts"
                  checked={searchType === 'posts'}
                  onChange={(e) => setSearchType(e.target.value as 'posts' | 'profiles')}
                  className="sr-only"
                  disabled={isSearching}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">📝 Posts & Content</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Find recent posts mentioning the business
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                  searchType === 'profiles'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="searchType"
                  value="profiles"
                  checked={searchType === 'profiles'}
                  onChange={(e) => setSearchType(e.target.value as 'posts' | 'profiles')}
                  className="sr-only"
                  disabled={isSearching}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">👥 User Profiles</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Find accounts with matching names
                  </div>
                </div>
              </label>
            </div>
          </div>
        </fieldset>

        {/* Platform Selection */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Platforms to Search
          </legend>
          <div className="flex flex-col gap-2" aria-labelledby="platformtype-legend">
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="sr-only"
                    disabled={isSearching}
                  />
                  <span className="text-lg mr-2">{platform.icon}</span>
                  <span className="text-sm">{platform.name}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>
        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          disabled={isSearching}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!businessName.trim() || selectedPlatforms.length === 0 || isSearching}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? (
            <SearchingSpinner />
          ) : (
            `Search for ${searchType === 'profiles' ? 'Profiles' : 'Posts'}`
          )}
        </button>
      </form>

      {selectedPlatforms.length === 0 && (
        <p className="text-sm text-red-600 mt-2">Please select at least one platform to search.</p>
      )}
    </>
  );
}
