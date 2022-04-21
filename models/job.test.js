"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: "0.025",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    newJob.id = job.id;
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${newJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 100000,
        equity: "0.025",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.01",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.02",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.03",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const result = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );

    let job = await Job.get(result.rows[0].id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1,
      equity: "0.01",
      companyHandle: "c1",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "updated",
    salary: 100000,
    equity: "0.999",
  };

  test("works", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    let job = await Job.update(id, updateData);

    expect(job).toEqual({
      id,
      ...updateData,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${id}`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "updated",
        salary: 100000,
        equity: "0.999",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const updateDataSetNulls = {
      title: "updated",
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id,
      ...updateDataSetNulls,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${id}`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "updated",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    await Job.remove(id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
