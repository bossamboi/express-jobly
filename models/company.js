"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
	 *
	 * data should be { handle, name, description, numEmployees, logoUrl }
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl }
	 *
	 * Throws BadRequestError if company already in database.
	 * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[handle, name, description, numEmployees, logoUrl]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 * */

	static async findAll() {
		const companiesRes = await db.query(
			`SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
		);
		return companiesRes.rows;
	}

	/** Given certain parameters, find companies by filtered search terms
	 *
	 * Queries object must contain any of the following keys:
	 *    name, minEmployees, maxEmployees
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 */

	static async findByFilter(queries) {
		const { whereClause, values } = Company.sqlForCompanyFilterSearch(queries);

		const companiesRes = await db.query(
			`SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE ${whereClause}
           ORDER BY name`,
			values
		);
		return companiesRes.rows;
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
      whereClause: `name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3``
      values: ['%Apple%', 4, 100]

   Throws BadRequestError if queries.minEmployees > queries.maxEmployees or
   if query is invalid.
 */

	static sqlForCompanyFilterSearch(queries) {
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

	/** Given a company handle, return data about company.
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl, jobs }
	 *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Update company data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {name, description, numEmployees, logoUrl}
	 *
	 * Returns {handle, name, description, numEmployees, logoUrl}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: "num_employees",
			logoUrl: "logo_url",
		});
		const handleVarIdx = "$" + (values.length + 1);

		const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [...values, handle]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns handle that was deleted.
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[handle]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}
}

module.exports = Company;
