/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import Log from "../Util";
import Dataset from "../Dataset";
import Querying from "../Querying";
import {QueryResponse, Options} from "../Querying";

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

            that.processDataset(id, content).then(function (bool: boolean) {
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
            if (that.dataStruct.hasOwnProperty(id)) {
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
            let courses = that.dataStruct['courses'];
            let qr = new Querying(courses);
            let where = query.WHERE;
            let options = query.OPTIONS;
            qr.getWhere(where).then(function (set) {
                that.renderOptions(options, set).then(function (qr) {
                    let render = qr.render;
                    let result = qr.result;
                    fulfill({code: 200, body: {render, result}});
                }).catch(function (err) {
                    reject({code: 400, body: {error: err.message}});
                })
            }).catch(function (err) {
                reject({code: 400, body: {error: err.message}});
            });
        });
    }

    renderOptions(opt: Options, set: Dataset): Promise<QueryResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let columns = opt.COLUMNS;
                let order = opt.ORDER;
                let form = opt.FORM;
                set.data.sort(function (a, b) {
                    return a[order] - b[order];
                });
                if (form == "TABLE") {
                    let render = form;
                    let result = [];
                    for (let data of set.data) {
                        let c: any = {};
                        for (let col of columns) {
                            c[col] = data[col];
                        }
                        result.push(c);
                    }
                    let qr: QueryResponse = {render: render, result: result};
                    fulfill(qr);
                }
            }
            catch (err) {
                reject(err);
            }
        })
    }

    processDataset(id: string, content: string): Promise <boolean> {
        let that = this;
        let set = new Dataset();
        return new Promise(function (fulfill, reject) {
            let JSZip = require("jszip");
            let promises: Promise<any>[] = [];

            JSZip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                zip.folder(id).forEach(function (relativePath, file) {
                    promises.push(file.async('string').then(JSON.parse).then(function (obj) {
                        for (let res of obj.result) {
                            if (res.hasOwnProperty("Course")) {
                                let c: any = {};
                                c[id + '_uuid'] = res.id;
                                c[id + '_id'] = res.Course;
                                c[id + '_dept'] = res.Subject;
                                c[id + '_title'] = res.Title;
                                c[id + '_avg'] = res.Avg;
                                c[id + '_instructor'] = res.Professor;
                                c[id + '_pass'] = res.Pass;
                                c[id + '_fail'] = res.Fail;
                                c[id + '_audit'] = res.Audit;
                                set.add(c);
                            }
                        }
                    }));
                });
                Promise.all(promises).then(function () {
                    that.saveFile(id, set);
                    fulfill(set);
                });
            }).catch(function (err: Error) {
                reject(err);
            });
        });
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
