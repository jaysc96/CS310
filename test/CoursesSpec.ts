/**
 * Created by jaysinghchauhan on 2/4/17.
 */
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse, QueryRequest} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";

describe("CoursesSpec", function () {
    let fs = require("fs");
    let inf: InsightFacade;

    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
        inf = new InsightFacade();
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    it("addDataset courses", function () {
        let text = fs.readFileSync('courses.zip');
        return inf.addDataset('courses', text).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(204);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
    });

    it("perform simple query", function () {
        let query = {
            "WHERE":{
                "NOT": {
                    "LT": {
                        "courses_avg": 97
                    }
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_avg",
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(200);
        }).catch(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr.body));
            expect.fail();
        });
    });

    it('perform complex query', function () {
        let query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
                    },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(200);
        }).catch(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        });
    });

    it('perform another complex query', function () {
        let query = {
            "WHERE":{
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":70
                                }
                            },
                            {
                                "LT":{
                                    "courses_avg":80
                                }
                            }
                        ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(200);
        }).catch(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        });
    });

    it("do not perform invalid 'WHERE' query", function () {
        let query = {
            "WHERE":{
                "OR": [
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    },
                    {
                        "GT": {
                            "courses_sys": 95
                        }
                    }
                    ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        }).catch(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(400);
        });
    });

    it("do not perform invalid 'OPTIONS' query", function () {
        let query = {
            "WHERE":{
                "OR": [
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    },
                    {
                        "GT": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_sys",
                    "courses_avg",
                    "courses_uuid"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        }).catch(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(400);
        });
    });



    it("removeDataset courses", function () {
        return inf.removeDataset('courses').then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(204);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
    });
});
