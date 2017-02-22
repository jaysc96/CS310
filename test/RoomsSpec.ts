import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
import {expect} from 'chai';
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
});