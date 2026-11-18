// Controller for /api/hosts
//
// Step 4: getHostListings(req, res)
//   - hostId is not a number -> 400, no places found -> 404
//   - try/catch -> 500 { error }
const dal = require('../dal/hosts.dal');

async function getHostListings(req, res) {
  try {
    if (!/^\d+$/.test(req.params.hostId)) {
      return res.status(400).json({ error: 'hostId must be a number' });
    }

    const rows = await dal.getListingsByHost(Number(req.params.hostId));
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getHostListings };