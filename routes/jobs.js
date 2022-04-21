"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureIsAdmin, async function (req, res, next) {
	const validator = jsonschema.validate(req.body, jobNewSchema);
	if (!validator.valid) {
		const errs = validator.errors.map((e) => e.stack);
		throw new BadRequestError(errs);
	}

	const job = await Job.create(req.body);
	return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
	let jobs;

	if (Object.keys(req.query).length > 0) {
		jobs = await Job.findByFilter(req.query);
	} else {
		jobs = await Job.findAll();
	}

	return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company_handle }
 *
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
	const job = await Job.get(parseInt(req.params.id));
	return res.json({ job });
});

module.exports = router;
