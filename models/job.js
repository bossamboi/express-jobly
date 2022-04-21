"use strict";

const db = require("../db");
const { BadRequestError } = require("../expressError");

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { title, salary, equity, company_handle }
	 *
	 * Returns { id, title, salary, equity, company_handle }
	 *
	 * Throws BadRequestError if job already in database.
	 * */

	static async create({ title, salary, equity, company_handle }) {
		const duplicateCheck = await db.query(
			`SELECT title FROM jobs WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
			[title, salary, equity, company_handle]
		);

		//TODO: CHECK/VALIDATE FOR VALID COMPANY HANDLE

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate job: ${title}, ${company_handle}`);

		const result = await db.query(
			`INSERT INTO jobs(
                title,
                salary,
                equity,
                company_handle)
            VALUES
                ($1, $2, $3, $4)
            RETURNING title, salary, equity, company_handle AS "companyHandle"`,
			[title, salary, equity, company_handle]
		);
		const job = result.rows[0];

		return job;
	}
}

module.exports = Job;
