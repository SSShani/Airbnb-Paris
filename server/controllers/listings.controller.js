// Controller for /api/listings - reads req.query / req.params, validates, calls the DAL,
// sets the status code and sends JSON. No SQL here.
//
// Step 2: getListings(req, res)
//   - read neighbourhood, roomType, minPrice, maxPrice, sort, limit from req.query
//   - validate: limit (default 20, max 50), minPrice/maxPrice are numbers, sort is "price" or "rating"
//     (anything else -> 400 { error })
//   - map sort to a column name here: ORDER BY can't be a parameter
//
// Step 3: getListingById(req, res)
//   - id is not a number -> 400, no such id -> 404
//   - convert hostIsSuperhost 't' / 'f' to true / false
//
// Every controller: try/catch -> 500 { error } when the DAL throws.
const dal = require('../dal/listings.dal');

const SORTS = {
  price: 'price ASC',
  rating: 'review_scores_rating DESC'
};
async function getListingById(req, res) {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'id must be a number' });
    }

    const row = await dal.getListingById(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Listing not found' });

    row.hostIsSuperhost = row.hostIsSuperhost === 't';
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getListings, getListingById };

function parsePrice(value) {
  if (value === undefined) return null;
  const n = Number(value);
  if (value === '' || Number.isNaN(n) || n < 0) return NaN;
  return n;
}

async function getListings(req, res) {
  try {
    const { neighbourhood, roomType, sort = 'price' } = req.query;

    if (!SORTS[sort]) return res.status(400).json({ error: 'Invalid sort' });

    let limit = 20;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit <= 0) {
        return res.status(400).json({ error: 'limit must be a whole number from 1 to 50' });
      }
      if (limit > 50) limit = 50;
    }

    const minPrice = parsePrice(req.query.minPrice);
    const maxPrice = parsePrice(req.query.maxPrice);
    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const rows = await dal.getListings({
      neighbourhood, roomType, minPrice, maxPrice,
      orderBy: SORTS[sort], limit
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// module.exports = { getListings };