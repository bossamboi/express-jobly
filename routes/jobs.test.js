"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: 0.025,
    companyHandle: "c1",
  };

  test("ok for users with admin access", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 100000,
        equity: "0.025",
        companyHandle: "c1",
      },
    });
  });

  test("Fail: create job without admin access", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        equity: "0.001",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon: no filter or query", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
          equity: "0",
          companyHandle: "c3",
        },
      ],
    });
  });

  test("ok for get with single query", async function () {
    const resp = await request(app).get("/jobs?title=j1");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 1,
          equity: "0.01",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("ok for get with multiple queries", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=2");
    expect(resp.body).toEqual({
      jobs: [
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
          equity: "0",
          companyHandle: "c3",
        },
      ],
    });
  });

  test("ok for get with multiple queries with hasEquity = true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true&minSalary=2");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j2",
          salary: 2,
          equity: "0.02",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("ok for get with multiple queries with hasEquity = false", async function () {
    const resp = await request(app).get("/jobs?hasEquity=false&minSalary=1");
    expect(resp.body).toEqual({
      jobs: [
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
          equity: "0",
          companyHandle: "c3",
        },
      ],
    });
  });

  test("fails for invalid query", async function () {
    const resp = await request(app).get("/jobs?invalidQuery=j1");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users with admin access", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1-new",
        salary: 1,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });

  test("Fail: users without admin access", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/c1`).send({
      title: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        id: 0,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        invalid: "not",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users with admin access", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: id });
  });

  test("Fail: users without admin access", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const jobResult = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'j1'`
    );
    const id = jobResult.rows[0].id;

    const resp = await request(app).delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
