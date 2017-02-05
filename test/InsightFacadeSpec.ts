/**
 * Created by jaysinghchauhan on 2/4/17.
 */
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";

describe("InsightFacadeSpec", function () {
    let fs = require("fs");
    let inf = new InsightFacade();

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

    it("addDataset courses", function (done) {
        let text = fs.readFileSync('courses.zip');
        inf.addDataset('courses', text).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(204);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
        done();
    });

    it("addDataset courses again", function (done) {
        let text = fs.readFileSync('courses.zip');
        inf.addDataset('courses', text).then(function (inr: InsightResponse) {
            Log.test(JSON.stringify(inr));
            expect(inr.code).to.equal(201);
        }).catch(function (err: Error) {
            Log.error(err.message);
            expect.fail();
        });
        done();
    });
});

