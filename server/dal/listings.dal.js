// DAL for listings - runs the SQL through the pool and returns the rows. No req / res here.
// Always pass values with .input(...) and use @name in the query.
//
// Step 2: getListings({ neighbourhood, roomType, minPrice, maxPrice, orderBy, limit })
//   SELECT TOP (@limit) ... FROM dbo.Paris_Airbnb_listings WHERE price IS NOT NULL ... ORDER BY ...
//   Build the fields in SQL: CONCAT (title), UPPER (propertyType), CAST ... AS INT, ROUND (stars)
//
// Step 3: getListingById(id)
//   DATEADD (hostSince), YEAR (hostSinceYear), DATEDIFF + GETDATE (yearsHosting), LEN (aboutLength)
const { sql, poolPromise } = require('../config/db');
async function getListingById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Float, id)
    .query(`
      SELECT
        CAST(l.id AS INT)                       AS id,
        CONCAT(l.room_type, ' in ', l.neighbourhood_cleansed) AS title,
        UPPER(l.property_type)                  AS propertyType,
        l.room_type                             AS roomType,
        l.neighbourhood_cleansed                AS neighbourhood,
        CAST(l.price AS INT)                    AS pricePerNight,
        ROUND(l.review_scores_rating / 20.0, 1) AS stars,
        CAST(l.number_of_reviews AS INT)        AS reviewsCount,
        CAST(l.bedrooms AS INT)                 AS bedrooms,
        CAST(l.beds AS INT)                     AS beds,
        CAST(l.accommodates AS INT)             AS accommodates,
        CAST(l.bathrooms AS INT)                AS bathrooms,
        l.latitude                              AS latitude,
        l.longitude                             AS longitude,
        CAST(l.host_id AS INT)                  AS hostId,
        l.host_name                             AS hostName,
        l.host_is_superhost                     AS hostIsSuperhost,
        h.hostSince                             AS hostSince,
        YEAR(h.hostSince)                       AS hostSinceYear,
        DATEDIFF(year, h.hostSince, GETDATE())  AS yearsHosting,
        l.host_about                            AS hostAbout,
        CAST(LEN(l.host_about) AS INT)          AS aboutLength
      FROM dbo.Paris_Airbnb_listings AS l
      CROSS APPLY (
        SELECT DATEADD(day, l.host_since - 2, '1900-01-01') AS hostSince
      ) AS h
      WHERE l.id = @id
    `);

  return result.recordset[0];
}



async function getListings({ neighbourhood, roomType, minPrice, maxPrice, orderBy, limit }) {
  const pool = await poolPromise;
  const request = pool.request();

  let where = 'WHERE price IS NOT NULL';

  if (neighbourhood) {
    where += ' AND neighbourhood_cleansed = @neighbourhood';
    request.input('neighbourhood', sql.NVarChar, neighbourhood);
  }
  if (roomType) {
    where += ' AND room_type = @roomType';
    request.input('roomType', sql.NVarChar, roomType);
  }
  if (minPrice !== null) {
    where += ' AND price >= @minPrice';
    request.input('minPrice', sql.Float, minPrice);
  }
  if (maxPrice !== null) {
    where += ' AND price <= @maxPrice';
    request.input('maxPrice', sql.Float, maxPrice);
  }

  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT TOP (@limit)
      CAST(id AS INT)                         AS id,
      CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
      UPPER(property_type)                    AS propertyType,
      room_type                               AS roomType,
      neighbourhood_cleansed                  AS neighbourhood,
      CAST(price AS INT)                      AS pricePerNight,
      ROUND(review_scores_rating / 20.0, 1)   AS stars,
      CAST(number_of_reviews AS INT)          AS reviewsCount,
      CAST(bedrooms AS INT)                   AS bedrooms,
      CAST(beds AS INT)                       AS beds,
      CAST(accommodates AS INT)               AS accommodates
    FROM dbo.Paris_Airbnb_listings
    ${where}
    ORDER BY ${orderBy}
  `);

  return result.recordset;
}

// module.exports = { getListings };
module.exports = { getListings, getListingById };