// Approximate [lng, lat] coordinates for well-known Nigerian event venues,
// areas, and states. There is no geocoding service wired into the app and
// Event documents don't store lat/lng — this hand-curated table is the
// fallback both the web map view and the mobile ticket-detail map use to
// place a marker from just venue/location/state strings.

export const NIGERIA_VENUE_COORDS: Record<string, [number, number]> = {
  'transcorp hilton': [7.4892, 9.0580],
  'transcorp hilton abuja': [7.4892, 9.0580],
  'sheraton abuja': [7.4905, 9.0532],
  'nicon luxury': [7.5089, 9.0572],
  'radisson blu abuja': [7.4917, 9.0600],
  'hilton abuja': [7.4892, 9.0580],
  'international conference centre': [7.5067, 9.0533],
  'icc abuja': [7.5067, 9.0533],
  'abuja national stadium': [7.4422, 9.0579],
  'moshood abiola stadium': [7.4422, 9.0579],
  'eko hotel': [3.4216, 6.4281],
  'eko hotel and suites': [3.4216, 6.4281],
  'eko hotels': [3.4216, 6.4281],
  'landmark event centre': [3.4283, 6.4333],
  'landmark beach': [3.4250, 6.4300],
  'federal palace hotel': [3.4188, 6.4303],
  'oriental hotel': [3.4227, 6.4294],
  'the oriental hotel': [3.4227, 6.4294],
  'lagos continental hotel': [3.3927, 6.4529],
  'sheraton lagos': [3.3540, 6.5973],
  'radisson blu lagos': [3.4367, 6.4267],
  'balmoral convention centre': [3.3558, 6.6012],
  'federal palace': [3.4188, 6.4303],
  'tafawa balewa square': [3.3903, 6.4527],
  'tbs': [3.3903, 6.4527],
  'national arts theatre': [3.3619, 6.5003],
  'muson centre': [3.4367, 6.4600],
  'terra kulture': [3.4228, 6.4392],
  'hard rock cafe lagos': [3.4292, 6.4340],
  'eko atlantic': [3.4100, 6.4150],
  'ocean parade': [3.4100, 6.4150],
  'lekki conservation centre': [3.5583, 6.4650],
  'genesis cinema': [3.3419, 6.6018],
  'presidential hotel port harcourt': [7.0500, 4.8333],
  'le meridien port harcourt': [7.0250, 4.8500],
  'novotel port harcourt': [7.0134, 4.8156],
  'tahir guest palace': [8.5247, 12.0022],
  'premier hotel ibadan': [3.9100, 7.3600],
  'international conference centre ibadan': [3.8960, 7.4160],
  'nike lake resort': [7.5383, 6.4700],
  'kwara state stadium': [4.5633, 8.4742],
  'sabe ilorin stadium': [4.5633, 8.4742],
  'save ilorin stadium': [4.5633, 8.4742],
  'ilorin township stadium': [4.5633, 8.4742],
  'kwara hotel': [4.5500, 8.4966],
  'protea hotel benin': [5.6037, 6.3350],
  'samuel ogbemudia stadium': [5.6150, 6.3500],
  'arewa house': [7.4278, 10.5264],
  'kaduna township stadium': [7.4233, 10.5233],
  'calabar carnival': [8.3269, 4.9500],
  'warri township stadium': [5.7450, 5.5133],
}

export const NIGERIA_AREA_COORDS: Record<string, [number, number]> = {
  'Ikoyi': [3.4375, 6.4550],
  'Victoria Island': [3.4216, 6.4281],
  'VI': [3.4216, 6.4281],
  'Lekki': [3.5852, 6.4698],
  'Ajah': [3.6199, 6.4651],
  'Ikeja': [3.3419, 6.6018],
  'Surulere': [3.3561, 6.5008],
  'Yaba': [3.3793, 6.5085],
  'Gbagada': [3.3860, 6.5542],
  'Festac': [3.2744, 6.4650],
  'Alausa': [3.3588, 6.6073],
  'Maryland': [3.3667, 6.5667],
  'Oniru': [3.4533, 6.4367],
  'Maitama': [7.4961, 9.0765],
  'Wuse': [7.4892, 9.0600],
  'Garki': [7.5014, 9.0522],
  'Gwarinpa': [7.4167, 9.1167],
  'Asokoro': [7.5233, 9.0433],
  'Central Business District': [7.5067, 9.0533],
  'CBD': [7.5067, 9.0533],
  'Port Harcourt': [7.0134, 4.8156],
  'Ibadan': [3.9470, 7.3775],
  'Kano': [8.5247, 12.0022],
  'Enugu': [7.4951, 6.4527],
  'Abeokuta': [3.3503, 7.1475],
  'Ilorin': [4.5418, 8.4966],
  'Benin City': [5.6037, 6.3350],
  'Warri': [5.7480, 5.5167],
  'Asaba': [6.7500, 6.2000],
  'Owerri': [7.0498, 5.4920],
  'Uyo': [7.9306, 5.0073],
  'Calabar': [8.3269, 5.8700],
  'Kaduna': [7.4391, 10.5264],
  'Osogbo': [4.5450, 7.7667],
  'Oshogbo': [4.5450, 7.7667],
}

export const NIGERIA_STATE_COORDS: Record<string, [number, number]> = {
  'Lagos': [3.3792, 6.5244],
  'Abuja': [7.1847, 9.0765],
  'Rivers': [7.0134, 4.8156],
  'Kano': [8.5247, 12.0022],
  'Oyo': [3.9470, 7.3775],
  'Delta': [6.7470, 6.2063],
  'Anambra': [7.0779, 6.2108],
  'Enugu': [7.4951, 6.4527],
  'Kaduna': [7.4391, 10.5264],
  'Imo': [7.0498, 5.4920],
  'Plateau': [8.8921, 9.2182],
  'Cross River': [8.3269, 5.8700],
  'Osun': [4.4833, 7.5629],
  'Borno': [13.1571, 11.8333],
  'Bayelsa': [6.3316, 4.7719],
  'Ogun': [3.3499, 6.9980],
  'Ekiti': [5.2311, 7.7190],
  'Edo': [5.6037, 6.3350],
  'Kwara': [4.5418, 8.4966],
  'Niger': [6.5569, 9.9309],
  'Sokoto': [5.2379, 13.0059],
  'Akwa Ibom': [7.9306, 5.0073],
  'Benue': [8.1135, 7.7279],
  'Abia': [7.3667, 5.4527],
  'Taraba': [11.3511, 7.8739],
  'Zamfara': [6.6572, 12.1699],
  'Adamawa': [12.3984, 9.3265],
  'Yobe': [12.2950, 12.1099],
  'Nasarawa': [8.3147, 8.5374],
  'Ebonyi': [8.1137, 6.2649],
  'Gombe': [11.0000, 10.2791],
  'Kogi': [6.7388, 7.8003],
  'Ondo': [4.8333, 7.2500],
  'Kebbi': [4.1975, 12.4534],
  'Bauchi': [9.8446, 10.3103],
  'Katsina': [7.6018, 12.9897],
  'Jigawa': [9.3555, 12.2280],
}

export const DEFAULT_NIGERIA_COORD: [number, number] = [8.6753, 9.0820]

// Single-point lookup (no jitter) — venue name first, then area/location,
// then state centroid, then a default Nigeria-wide fallback. Returns [lng, lat].
export function getVenueCoords(
  venue?: string | null,
  location?: string | null,
  state?: string | null
): [number, number] {
  if (venue) {
    const key = venue.toLowerCase().trim()
    if (NIGERIA_VENUE_COORDS[key]) return NIGERIA_VENUE_COORDS[key]
  }

  if (location) {
    const areaKey = Object.keys(NIGERIA_AREA_COORDS).find(
      (k) => k.toLowerCase() === location.toLowerCase().trim()
    )
    if (areaKey) return NIGERIA_AREA_COORDS[areaKey]
  }

  if (state) {
    const stateKey = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase()
    if (NIGERIA_STATE_COORDS[stateKey]) return NIGERIA_STATE_COORDS[stateKey]
  }

  return DEFAULT_NIGERIA_COORD
}
