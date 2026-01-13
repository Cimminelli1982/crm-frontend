// Country name to flag emoji mapping
const countryToFlag = {
  // Europe
  'Italy': '🇮🇹',
  'ITALY': '🇮🇹',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Ireland': '🇮🇪',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Greece': '🇬🇷',
  'Serbia': '🇷🇸',
  'Croatia': '🇭🇷',
  'Slovenia': '🇸🇮',
  'Slovakia': '🇸🇰',
  'Bulgaria': '🇧🇬',
  'Ukraine': '🇺🇦',
  'Russia': '🇷🇺',
  'Latvia': '🇱🇻',
  'Lithuania': '🇱🇹',
  'Estonia': '🇪🇪',
  'Luxembourg': '🇱🇺',
  'Monaco': '🇲🇨',
  'San Marino': '🇸🇲',
  'Malta': '🇲🇹',
  'Cyprus': '🇨🇾',
  'Iceland': '🇮🇸',

  // Americas
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Cuba': '🇨🇺',
  'El Salvador': '🇸🇻',

  // Asia
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'India': '🇮🇳',
  'Indonesia': '🇮🇩',
  'Singapore': '🇸🇬',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷',
  'Kuwait': '🇰🇼',
  'Qatar': '🇶🇦',
  'Bahrain': '🇧🇭',
  'Oman': '🇴🇲',
  'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵',
  'Armenia': '🇦🇲',
  'Georgia': '🇬🇪',
  'Azerbaijan': '🇦🇿',
  'Kazakhstan': '🇰🇿',
  'Uzbekistan': '🇺🇿',
  'Kyrgyzstan': '🇰🇬',

  // Africa
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Morocco': '🇲🇦',
  'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪',
  'Ghana': '🇬🇭',
  'Ethiopia': '🇪🇹',
  'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿',

  // Oceania
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',

  // Special entries (for data that's not really cities)
  'Country Entry': '🌍',
  'Region Entry': '📍',
  'Invalid Entry': '⚠️',
};

/**
 * Get flag emoji for a country name
 * @param {string} country - Country name
 * @returns {string|null} Flag emoji or null if not found
 */
export const getCountryFlag = (country) => {
  if (!country) return null;
  return countryToFlag[country] || null;
};

/**
 * Format city with flag
 * @param {string} cityName - City name
 * @param {string} country - Country name
 * @returns {string} Formatted string with flag
 */
export const formatCityWithFlag = (cityName, country) => {
  const flag = getCountryFlag(country);
  if (flag && country !== 'Unknown') {
    return `${flag} ${cityName}`;
  }
  return cityName;
};

export default countryToFlag;
