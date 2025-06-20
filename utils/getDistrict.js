// Load environment variables (ensure this is called before using process.env)
require('dotenv').config();

const axios = require('axios');
const { stateFipsMap } = require('./stateFipsMap');

// Verify your LocationIQ key is loaded
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
if (!LOCATIONIQ_API_KEY) {
  console.error('⚠️ Missing LOCATIONIQ_API_KEY in environment');
}

/**
 * Convert an address to a congressional district using LocationIQ and TIGERweb.
 *
 * @param {string} street  Street address (e.g. '4305 Exeter Dr')
 * @param {string} city    City name (e.g. 'Dumfries')
 * @param {string} state   State abbreviation (e.g. 'VA')
 * @param {string} zipCode ZIP/postal code (e.g. '22025')
 * @returns {Promise<Object>} - { state, district, districtName }
 */
async function getDistrictFromAddress(street, city, state, zipCode) {
  if (!street || !city || !state || !zipCode) {
    throw new Error('Street, city, state, and ZIP code are required.');
  }

  try {
    // 1. Forward geocode with LocationIQ
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
    const geocodeUrl = 'https://us1.locationiq.com/v1/search';

    const geoRes = await axios.get(geocodeUrl, {
      params: {
        key: LOCATIONIQ_API_KEY,
        q: fullAddress,
        countrycodes: 'us',
        format: 'json',
        normalizeaddress: 1
      },
      headers: { accept: 'application/json' }
    });

    console.log('LocationIQ status:', geoRes.status);
    if (!Array.isArray(geoRes.data) || geoRes.data.length === 0) {
      throw new Error('No results from LocationIQ geocoding.');
    }

    // Extract lat/lon and convert to numbers
    const { lat: latString, lon: lonString } = geoRes.data[0];
    const lat = parseFloat(latString);
    const lon = parseFloat(lonString);

    // 2. Query TIGERweb for congressional district
    const tigerUrl =
      'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query';
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
      throw new Error('No congressional district found for these coordinates.');
    }

    // Map FIPS code to state abbreviation
    const { STATE: fipsCode, CD119, NAME } = features[0].attributes;
    const stateAbbr = stateFipsMap[fipsCode];
    if (!stateAbbr) {
      throw new Error(`No state abbreviation found for FIPS code: ${fipsCode}`);
    }

    return {
      state: stateAbbr,
      district: CD119.toString().padStart(2, '0'),
      districtName: NAME
    };
  } catch (error) {
    // If axios error, log status/data
    if (error.response) {
      console.error('LocationIQ error:', error.response.status, error.response.data);
    } else {
      console.error('Error in getDistrictFromAddress:', error.message);
    }
    throw error;
  }
}

module.exports = { getDistrictFromAddress };
