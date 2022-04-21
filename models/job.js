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

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title FROM jobs WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
      [title, salary, equity, companyHandle]
    );

    //TODO: CHECK/VALIDATE FOR VALID COMPANY HANDLE

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}, ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs(
                title,
                salary,
                equity,
                company_handle)
            VALUES
                ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle}, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
									title,
									salary,
									equity,
									company_handle AS "companyHandle"
						 FROM jobs
						 ORDER BY title`
    );
    return jobsRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
									title,
									salary,
									equity,
									company_handle AS "companyHandle"
						 FROM jobs
						 WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
}

module.exports = Job;
