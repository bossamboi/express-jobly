const { BadRequestError } = require("../expressError");

/** Allows for dynamic generation of UPDATE sql queries.
 *  
 * Takes in an object dataToUpdate and jsToSql and returns a string of setCols
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

module.exports = { sqlForPartialUpdate };
