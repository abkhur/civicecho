// utils/getDistrict.js
const axios = require('axios');

/**
 * Get the congressional district for a given address using the Census Geocoder API with geoLookup.
 *
 * @param {string} street - The street address.
 * @param {string} city - The city.
 * @param {string} state - The state (e.g., "VA").
 * @param {string} zipCode - The ZIP code.
 * @returns {Promise<Object>} - An object containing the state and district.
 */
async function getDistrictFromAddress(street, city, state, zipCode) {
  if (!street || !city || !state || !zipCode) {
    throw new Error("Street, city, state, and ZIP code are required.");
  }
  
  // Construct the API URL using the "geographies" return type with geoLookup,
  // benchmark=Public_AR_Current, vintage=Current_Current, format=json, and layers=54.
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/address?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&zip=${encodeURIComponent(zipCode)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json&layers=54`;
  
  try {
    const response = await axios.get(url);
    const result = response.data.result;
    if (!result) {
      throw new Error("No result found in the response.");
    }
    
    // Use the first address match
    const matches = result.addressMatches;
    if (!matches || matches.length === 0) {
      throw new Error("No address matches found in the response.");
    }
    
    const geographies = matches[0].geographies;
    if (!geographies) {
      throw new Error("No geographies found in the address match.");
    }
    
    // Log available geography keys for debugging purposes.
    console.log("Available geography keys:", Object.keys(geographies));
    
    // Find the key that includes "Congressional Districts"
    const cdKey = Object.keys(geographies).find(key => key.includes("Congressional Districts"));
    if (!cdKey) {
      throw new Error("No congressional district data found in the response.");
    }
    
    const districts = geographies[cdKey];
    if (districts && districts.length > 0) {
      const districtData = districts[0];
      return {
        state: districtData.STATE,
        district: districtData.CD119 || districtData.CONGDIST,
      };
    } else {
      throw new Error("No congressional district data found in the response.");
    }
  } catch (error) {
    console.error("Error fetching district from Census API:", error.message);
    throw error;
  }
}

module.exports = { getDistrictFromAddress };
