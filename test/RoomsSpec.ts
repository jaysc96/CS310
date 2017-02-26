import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import {InsightResponse, QueryRequest} from "../src/controller/IInsightFacade";
import {expect} from 'chai';
import {Query} from "../src/Querying";
/**
 * Created by jaysinghchauhan on 2/21/17.
 */

describe("RoomsSpec", function () {
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

    it("addDataset rooms", function () {
        let text = fs.readFileSync('rooms.zip');
        return inf.addDataset('rooms', text).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(204);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
    });

    it('perform simple query', function () {
        let query: QueryRequest = {
            "WHERE": {
                "IS": {
                    "rooms_name": "*110"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        };
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr.body));
            expect(inr.code).to.equal(200)
        }).catch(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        })
    });

    it('perform complex query', function () {
        let query: QueryRequest = {
            "WHERE":{
                "IS":{
                    "rooms_furniture": "Classroom-Movable Tables & Chairs"
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "rooms_fullname", "rooms_shortname", "rooms_number", "rooms_name", "rooms_address",
                    "rooms_lat", "rooms_lon", "rooms_seats", "rooms_type", "rooms_furniture", "rooms_href"
                ],
                "ORDER":"rooms_name",
                "FORM":"TABLE"
            }
        };;
        return inf.performQuery(query).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr.body));
            expect(inr.code).to.equal(200)
        }).catch(function (inr: InsightResponse) {
            Log.error(JSON.stringify(inr));
            expect.fail();
        })
    });

    it("removeDataset rooms", function () {
        return inf.removeDataset('rooms').then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(204);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
    })
});