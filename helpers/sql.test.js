const { sqlForPartialUpdate } = require("./sql");
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
