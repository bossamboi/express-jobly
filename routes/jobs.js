"use strict";

/** Routes for jobs. */

// const jsonschema = require("jsonschema");
const express = require("express");

// const { BadRequestError } = require("../expressError");
// const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

// const companyNewSchema = require("../schemas/companyNew.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: TODO
 */

router.post("/", async function (req, res, next) {
	//   const validator = jsonschema.validate(req.body, companyNewSchema);
	//   if (!validator.valid) {
	//     const errs = validator.errors.map((e) => e.stack);
	//     throw new BadRequestError(errs);
	//   }

	const job = await Job.create(req.body);
	return res.status(201).json({ job });
});

module.exports = router;
