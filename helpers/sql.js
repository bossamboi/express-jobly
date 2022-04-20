const { BadRequestError } = require("../expressError");

/** Takes in an object dataToUpdate and jsToSql and returns a string of setCols
 * and an array of values to pass into an SQL query.
 *
 * dataToUpdate = {firstName: 'Aliya', age: 32}
 *
 * This converts JS variable names to SQL column names:
 *
 * jsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    }

    Returns a joined string of columns and parameterized queries:

      setCols: `"first_name"=$1, "age"=$2`
      values: ['Aliya', 32]
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map(
		(colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
	);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

/** Takes in an object queries and returns a string of whereClause and
 * an array of values to pass into an SQL query.
 *
 * Queries object must contain any of the following keys:
 *    name, minEmployees, maxEmployees
 *
 * queries = {name: 'Apple',
 *            minEmployees: 4,
 *            maxEmployees: 100}
 *
   Returns a joined string of columns and parameterized queries:
      whereClause: `name ILIKE $1 AND minEmployees >= $2 AND maxEmployees <= $3``
      values: ['Apple', 4, 100]

   Throws BadRequestError if queries.minEmployees > queries.maxEmployees or
   if query is invalid.
 */

function sqlForCompanyFilterSearch(queries) {
	if (queries.minEmployees > queries.maxEmployees) {
		throw new BadRequestError(
			"minEmployees cannot be greater than maxEmployees."
		);
	}

	const keys = Object.keys(queries);
	const values = Object.values(queries);
	let cols = [];

	for (let i = 0; i < keys.length; i++) {
		if (keys[i] === "name") {
			cols.push(`name ILIKE $${i + 1}`);
			values[i] = `%${values[i]}%`; // updates values so we can search for part of name
		} else if (keys[i] === "minEmployees") {
			cols.push(`num_employees >= $${i + 1}`);
		} else if (keys[i] === "maxEmployees") {
			cols.push(`num_employees <= $${i + 1}`);
		} else {
			throw new BadRequestError(`${keys[i]} is not a valid query.`);
		}
	}

	return {
		whereClause: cols.join(" AND "),
		values,
	};
}

module.exports = { sqlForPartialUpdate, sqlForCompanyFilterSearch };
