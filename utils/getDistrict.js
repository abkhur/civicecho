// utils/getDistrict.js
const axios = require('axios');
const { stateFipsMap } = require('./stateFipsMap');

/**
 * Convert an address to a congressional district using Nominatim and TIGERweb.
 *
 * @param {string} street
 * @param {string} city
 * @param {string} state
 * @param {string} zipCode
 * @returns {Promise<Object>} - Object with state (abbreviation) and district
 */
async function getDistrictFromAddress(street, city, state, zipCode) {
  if (!street || !city || !state || !zipCode) {
    throw new Error("Street, city, state, and ZIP code are required.");
  }

  try {
    // 1. Geocode with Nominatim
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;

    const geoRes = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'CivicEcho/1.0 (https://civicecho.org; abkhur@vt.edu)'
      }
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error("No results from Nominatim geocoding.");
    }

    const { lat, lon } = geoRes.data[0];

    // 2. Query TIGERweb
    const tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query`;
    const tigerParams = {
      f: 'json',
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'STATE,CD119,NAME',
      returnGeometry: false
    };

    const tigerRes = await axios.get(tigerUrl, { params: tigerParams });

    const features = tigerRes.data?.features;
    if (!features || features.length === 0) {
      throw new Error("No congressional district found for these coordinates.");
    }

    const districtInfo = features[0].attributes;
    const fipsCode = districtInfo.STATE;
    const stateAbbr = stateFipsMap[fipsCode];

    if (!stateAbbr) {
      throw new Error(`No state abbreviation found for FIPS code: ${fipsCode}`);
    }

    return {
      state: stateAbbr,
      district: districtInfo.CD119.padStart(2, '0'),
      districtName: districtInfo.NAME
    };
  } catch (error) {
    console.error("Error in getDistrictFromAddress:", error.message);
    throw error;
  }
}

module.exports = { getDistrictFromAddress };
