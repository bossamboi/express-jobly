const { sqlForPartialUpdate, sqlForCompanyFilterSearch } = require("./sql");
const { BadRequestError } = require("../expressError");
const { set } = require("express/lib/application");

describe("sql partial update", function () {
	test("Fail: No data to update", function () {
		const data = {};
		const jsToSql = {
			firstName: "first_name",
			lastName: "last_name",
			isAdmin: "is_admin",
		};

		expect(() => sqlForPartialUpdate(data, jsToSql)).toThrow(BadRequestError);
	});

	test("Pass: receiving sql for update", function () {
		const data = { firstName: "Test", age: 18 };
		const jsToSql = {
			firstName: "first_name",
			lastName: "last_name",
			isAdmin: "is_admin",
		};

		const { setCols, values } = sqlForPartialUpdate(data, jsToSql);

		expect(setCols).toEqual(`"first_name"=$1, "age"=$2`);
		expect(values).toEqual(["Test", 18]);
	});
});

describe("sql company filter search", function () {
	// test("Fail: No data to update", function () {
	// 	const data = {};
	// 	const jsToSql = {
	// 		firstName: "first_name",
	// 		lastName: "last_name",
	// 		isAdmin: "is_admin",
	// 	};

	// 	expect(() => sqlForPartialUpdate(data, jsToSql)).toThrow(BadRequestError);
	// });

	test("Pass: receiving correct whereClause and values", function () {
		const query = { name: "Apple", minEmployees: 4, maxEmployees: 100 };

		const { whereClause, values } = sqlForCompanyFilterSearch(query);

		expect(whereClause).toEqual(
			`name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3`
		);
		expect(values).toEqual(["%Apple%", 4, 100]);
	});

	test("Pass: works for only some queries", function () {
		const query = { name: "Apple", minEmployees: 4 };

		const { whereClause, values } = sqlForCompanyFilterSearch(query);

		expect(whereClause).toEqual(`name ILIKE $1 AND num_employees >= $2`);
		expect(values).toEqual(["%Apple%", 4]);
	});

	test("Fail: when minEmployees > maxEmployees", function () {
		const query = { minEmployees: 20, maxEmployees: 5 };

		expect(() => sqlForCompanyFilterSearch(query)).toThrow(BadRequestError);
	});

	test("Fail: when query is invalid", function () {
		const query = { companyAge: 20, maxEmployees: 5 };

		expect(() => sqlForCompanyFilterSearch(query)).toThrow(BadRequestError);
	});
});
