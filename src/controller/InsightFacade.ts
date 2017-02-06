/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest, QueryResponse} from "./IInsightFacade";
import Log from "../Util";
import Dataset from "../Dataset";

export interface Struct {
    [id: string]: Dataset
}

export default class InsightFacade implements IInsightFacade {

    public dataStruct: Struct = {};
    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let flag = 0;

            if(that.dataStruct.hasOwnProperty(id))
                flag = 1;

            that.processDataset(id, content).then(function (data) {
                if (flag == 1)
                    fulfill({code: 201, body: {}});
                else
                    fulfill({code: 204, body: {}});
            }).catch(function (err) {
                reject({code: 400, body: {error: err.message}});
            });
        });
    }

    removeDataset(id: string): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            if(that.dataStruct.hasOwnProperty(id)) {
                that.removeFile(id);
                delete that.dataStruct[id];
                fulfill({code: 204, body: {}});
            }
            else
                reject({code: 404, body: {error: "Dataset to be removed was not added prevously"}});
        });
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            that.getQueryData(query).then(function (qr) {
                fulfill({code: 200, body: qr});
            })
        });
    }

    getQueryData(where: Object): Promise<QueryResponse> {
        let that = this;
        return new Promise (function (fulfill, reject) {

        });
    }

    processDataset(id: string, content: string): Promise <Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let JSZip = require("jszip");
            let promises: Promise<any>[] = [];
            let set = new Dataset();

            JSZip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                zip.folder(id).forEach(function (relativePath, file) {
                    promises.push(file.async('string').then(JSON.parse).then(function (obj) {
                        for (let i in obj.result) {
                            if (obj.result[i].hasOwnProperty("Course")) {
                                let c: any = {};
                                c[id + '_uuid'] = obj.result[i].id;
                                c[id + '_id'] = obj.result[i].Course;
                                c[id + '_dept'] = obj.result[i].Subject;
                                c[id + '_title'] = obj.result[i].Title;
                                c[id + '_avg'] = obj.result[i].Avg;
                                c[id + '_instructor'] = obj.result[i].Professor;
                                c[id + '_pass'] = obj.result[i].Pass;
                                c[id + '_fail'] = obj.result[i].Fail;
                                c[id + '_audit'] = obj.result[i].Audit;
                                set.add(c);
                            }
                        }
                    }).catch (function (err: Error) {
                        Log.trace(err.message);
                    }));
                });
                Promise.all(promises).then(function () {
                    if(set.data.length == 0)
                        reject();
                    fulfill(set);
                    that.saveFile(id, set);
                });
            });
        })
    }

    saveFile(id: string, set: Dataset) {
        let fs = require('fs');
        this.dataStruct[id] = set;
        let s = JSON.stringify(this.dataStruct[id].data);

        let dir = "./data";

        if (!fs.existsSync(dir)) {
            fs.mkdir("./data");
        }

        fs.writeFileSync("./data/" + id + ".json", s);
    }

    removeFile(id: string) {
        let fs = require('fs');
        fs.unlinkSync('./data/' + id + ".json");
    }
}
