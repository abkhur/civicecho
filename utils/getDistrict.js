require('dotenv').config();
const axios = require('axios');
const { stateFipsMap } = require('./stateFipsMap');

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

/**
 * Convert an address to a congressional district using LocationIQ and TIGERweb.
 *
 * @param {string} street
 * @param {string} city
 * @param {string} state
 * @param {string} zipCode
 * @returns {Promise<Object>} - Object with state (abbreviation), district (padded), and districtName
 */
async function getDistrictFromAddress(street, city, state, zipCode) {
  if (!street || !city || !state || !zipCode) {
    throw new Error('Street, city, state, and ZIP code are required.');
  }

  try {
    // 1. Forward geocode with LocationIQ
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
    const locIQUrl = 'https://us1.locationiq.com/v1/search.php';
    const geoRes = await axios.get(locIQUrl, {
      params: {
        key: LOCATIONIQ_API_KEY,
        q: fullAddress,
        format: 'json',
        normalizeaddress: 1
      }
    });

    if (!Array.isArray(geoRes.data) || geoRes.data.length === 0) {
      throw new Error('No results from LocationIQ geocoding.');
    }

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
    console.error('Error in getDistrictFromAddress:', error.message);
    throw error;
  }
}

module.exports = { getDistrictFromAddress };
