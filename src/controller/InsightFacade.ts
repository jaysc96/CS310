/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import Log from "../Util";
import Dataset from "../Dataset";
import Querying from "../Querying";
import {QueryResponse, Options} from "../Querying";
import {Where} from "../Querying";
//import {ASTNode} from "parse5";
let parse5 = require('parse5');

export interface Struct {
    [id: string]: Dataset
}

export default class InsightFacade implements IInsightFacade {

    public dataStruct: Struct = {};
    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    public addDataset(id: string, content: string): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let flag = 0;

            if(that.dataStruct.hasOwnProperty(id))
                flag = 1;

            that.processDataset(id, content).then(function (bool: boolean) {
                if (bool) {
                    if (flag == 1)
                        fulfill({code: 201, body: {}});
                    else
                        fulfill({code: 204, body: {}});
                }
                else
                    throw new Error("Empty dataset provided");
            }).catch(function (err) {
                reject({code: 400, body: {error: err.message}});
            });
        });
    }

    public removeDataset(id: string): Promise<InsightResponse> {
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

    public performQuery(query: QueryRequest): Promise <InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let where: Where = query.WHERE;
                let options: Options = query.OPTIONS;
                let key = options.ORDER.split('_')[0];
                if (!that.dataStruct.hasOwnProperty(key))
                    reject({code: 424, body: {missing: [key]}});
                let qr = new Querying(that.dataStruct, key);
                qr.getWhere(where).then(function (set) {
                    that.renderOptions(options, set).then(function (qr) {
                        let render = qr.render;
                        let result = qr.result;
                        fulfill({code: 200, body: {render, result}});
                    }).catch(function (err) {
                        if (err.hasOwnProperty("missing"))
                            reject({code: 424, body: err});
                        reject({code: 400, body: {error: err.message}})
                    })
                }).catch(function (err) {
                    if (err.hasOwnProperty("missing"))
                        reject({code: 424, body: err});
                    reject({code: 400, body: {error: err.message}});
                });
            }
            catch(err) {
                reject({code: 400, body: {error: err.message}});
            }
        });
    }

    private processDataset(id: string, content: string): Promise <boolean> {
        let that = this;
        let set = new Dataset();
        return new Promise(function (fulfill, reject) {
            let JSZip = require("jszip");
            let promises: Promise<any>[] = [];

            JSZip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                if(zip.file("index.htm") !== null) {
                    zip.file("index.htm").async('string').then(function (file) {
                        let i = file.indexOf("<tbody>");
                        let j = file.indexOf("</tbody>");
                        let tbody = parse5.parseFragment(file.substring(i,j)).childNodes[0];
                        let rooms: any[] = [];
                        tbody.childNodes.forEach(function (node: Node) {
                            if(node.nodeName == 'tr') {
                                let room: any = {};
                                room = that.processNode(node, id, room);
                                rooms.push(room);
                            }
                        });
                        fulfill(true);
                    })
                }
                else {
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
                                    c[id + '_years'] = res.Section == "overall" ? 1900 : res.Year;
                                    set.add(c);
                                }
                            }
                        }));
                    });
                    Promise.all(promises).then(function () {
                        that.saveFile(id, set);
                        if (set.data.length == 0)
                            fulfill(false);
                        fulfill(true);
                    });
                }
            }).catch(function (err: Error) {
                reject(err);
            });
        });
    }

    private processNode(node: Node, id: string, room: any): any {
        if(node.childNodes) {
            /*
            node.childNodes.forEach(function (n) {
                this.processNode(n, id, room);
            })
            */
        }
        return room;
    }

    private saveFile(id: string, set: Dataset) {
        let fs = require('fs');
        this.dataStruct[id] = set;
        let s = JSON.stringify(this.dataStruct[id].data);

        let dir = "./data";

        if (!fs.existsSync(dir)) {
            fs.mkdir("./data");
        }

        fs.writeFileSync("./data/" + id + ".json", s);
    }

    private removeFile(id: string) {
        let fs = require('fs');
        fs.unlinkSync('./data/' + id + ".json");
    }

    private renderOptions(opt: Options, set: Dataset): Promise<QueryResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let columns = opt.COLUMNS;
                let order = opt.ORDER;
                let form = opt.FORM;
                if (columns.length == 0)
                    reject(new Error ("Empty COLUMNS"));
                else {
                    let err: {missing: string[]} = {missing: []};
                    for (let col of columns) {
                        let key = col.split('_')[0];
                        if(!that.dataStruct.hasOwnProperty(key))
                            err.missing.push(key);
                    }
                    if(err.missing.length > 0) {
                        reject(err);
                    }
                }
                if (!columns.includes(order))
                    reject(new Error ("ORDER should be present in COLUMNS"));
                if(set.data.length == 0)
                    fulfill({render: form, result: []});
                else if (!set.data[0].hasOwnProperty(order))
                    reject(new Error ("Invalid ORDER"));
                set.data.sort(function (a, b) {
                    return a[order] - b[order];
                });
                if (form == "TABLE") {
                    let render = form;
                    let result: any[] = [];
                    for (let data of set.data) {
                        let c: any = {};
                        for (let col of columns) {
                            if(data.hasOwnProperty(col))
                                c[col] = data[col];
                            else
                                reject(new Error("Invalid COLUMNS"));
                        }
                        result.push(c);
                    }
                    let qr: QueryResponse = {render: render, result: result};
                    fulfill(qr);
                }
                else
                    reject(new Error("Invalid FORM"));
            }
            catch (err) {
                reject(err);
            }
        })
    }
}
