"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

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

  /** Given certain parameters, find jobs by filtered search terms
   *
   * Queries object must contain any of the following keys:
   *    title, minSalary, hasEquity
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findByFilter(queries) {
    const { whereClause, values } = Job.sqlForJobFilterSearch(queries);
    const jobsRes = await db.query(
      `SELECT id,
							title,
							salary,
							equity,
							company_handle AS "companyHandle"
				 FROM jobs
				 WHERE ${whereClause}
				 ORDER BY title`,
      values
    );
    return jobsRes.rows;
  }

  /** Takes in an object queries and returns a string of whereClause and
* an array of values to pass into an SQL query.
*
* Queries object must contain any of the following keys:
*    title, minSalary, hasEquity
*
* queries = {title: 'Software Engineer',
*            minSalary: 100000,
*            hasEquity: true}
*
 Returns a joined string of columns and parameterized queries:
		whereClause: `title ILIKE $1 AND salary >= $2 AND equity = $3``
		values: ['%Software Engineer%', 100000, true]
*/

  static sqlForJobFilterSearch(queries) {
    const keys = Object.keys(queries);
    const values = Object.values(queries);
    let cols = [];

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "title") {
        cols.push(`title ILIKE $${i + 1}`);
        values[i] = `%${values[i]}%`; // updates values so we can search for part of name
      } else if (keys[i] === "minSalary") {
        cols.push(`salary >= $${i + 1}`);
      } else if (keys[i] === "hasEquity") {
        if (values[i] === "true") {
          // checks value of hasEquity
          cols.push(`equity > $${i + 1}`);
        } else {
          cols.push(`equity >= $${i + 1}`);
        }
        values[i] = 0;
      } else {
        throw new BadRequestError(`${keys[i]} is not a valid query.`);
      }
    }

    return {
      whereClause: cols.join(" AND "),
      values,
    };
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle}
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

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns job id deleted.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
