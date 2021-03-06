/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import Log from "../Util";
import Dataset from "../Dataset";
import Querying from "../Querying";
import {QueryResponse, Options} from "../Querying";
import {Where} from "../Querying";
import {isUndefined} from "util";
let parse5 = require('parse5');

export interface Struct {
    [id: string]: Dataset
}

export interface GeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
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
                let key: string = "";

                for(let col of options.COLUMNS) {
                    if(col.indexOf('_') != -1)
                        key = col.split('_')[0];
                }

                if (key == "")
                    key = query.TRANSFORMATIONS.GROUP[0].split('_')[0];

                if (!that.dataStruct.hasOwnProperty(key))
                    reject({code: 424, body: {missing: [key]}});

                let qr = new Querying(that.dataStruct, key);
                qr.getWhere(where).then(function (set) {
                    if(query.hasOwnProperty('TRANSFORMATIONS')) {
                        try {
                            set = qr.transform(query.TRANSFORMATIONS, options, set);
                        }
                        catch(err) {
                            if(err.hasOwnProperty('missing'))
                                return reject({code: 424, body: err});
                            reject({code: 400, body: {error: err.message}});
                        }
                    }
                    qr.renderOptions(options, set).then(function (qr) {
                        let render = qr.render;
                        let result = qr.result;
                        fulfill({code: 200, body: {render, result}});
                    }).catch(function (err) {
                        if (err.hasOwnProperty("missing"))
                            return reject({code: 424, body: err});
                        reject({code: 400, body: {error: err.message}})
                    })
                }).catch(function (err) {
                    if (err.hasOwnProperty("missing"))
                        return reject({code: 424, body: err});
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
        return new Promise(function (fulfill, reject) {
            let JSZip = require("jszip");
            let promises: Promise<any>[] = [];
            let set = new Dataset();

            JSZip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                if(id == 'rooms') {
                    zip.file("index.htm").async('string').then(function (file) {
                        let i = file.indexOf("<tbody>");
                        let j = file.indexOf("</tbody>");
                        let body = parse5.parseFragment(file.substring(i,j)).childNodes[0];
                        let bldgs: any[] = [];
                        let rooms: any[] = [];

                        body.childNodes.forEach(function (node: any) {
                            if(node.nodeName == 'tr') {
                                let bldg: any = {};
                                node.childNodes.forEach(function (cnode: any) {
                                    if(cnode.nodeName == 'td')
                                        Object.assign(bldg, that.processNode(cnode, id));
                                });

                                if(bldg.hasOwnProperty(id + '_address')) {
                                    promises.push(that.HttpGet(bldg, id).then((gr) => {
                                        if(!gr.hasOwnProperty('error')) {
                                            bldg[id + '_lat'] = gr.lat;
                                            bldg[id + '_lon'] = gr.lon;
                                        }
                                        bldgs.push(bldg);
                                    }).catch( (err: Error) => {
                                        bldgs.push(bldg);
                                    }));
                                }
                            }
                        });

                        Promise.all(promises).then(function () {
                            let promises2: Promise<any>[] = [];
                            for(let bldg of bldgs) {
                                promises2.push(zip.file(bldg['href']).async('string').then(function (str) {
                                    let m = str.indexOf("<tbody>");
                                    let n = str.indexOf("</tbody>");
                                    let tbody = parse5.parseFragment(str.substring(m,n)).childNodes[0];

                                    if(!isUndefined(tbody)) {
                                        tbody.childNodes.forEach(function (node: any) {
                                            if(node.nodeName == 'tr') {
                                                let room: any = {};
                                                node.childNodes.forEach(function (cnode: any) {
                                                    if (cnode.nodeName == 'td') {
                                                        Object.assign(room, that.processNode(cnode, id));
                                                    }
                                                });

                                                for(let key in bldg){
                                                    if(key != 'href') {
                                                        room[key] = bldg[key];
                                                    }
                                                }

                                                if(room.hasOwnProperty(id + '_shortname') && room.hasOwnProperty(id + '_number')) {
                                                    room[id+'_name'] = room[id + '_shortname']+'_'+room[id + '_number'];
                                                }
                                                rooms.push(room);
                                            }
                                        });
                                    }
                                }).catch(function(err: Error) {
                                    reject(err);
                                }));
                            }

                            Promise.all(promises2).then(function () {
                                for(let room of rooms) {
                                    set.add(room);
                                }
                                that.saveFile(id, set);
                                fulfill(true);
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err: Error) {
                            reject(err);
                        });
                    }).catch(function (err) {
                        reject(err);
                    })
                }

                else if(id == 'courses') {
                    zip.folder(id).forEach(function (relativePath, file) {
                        promises.push(file.async('string').then(JSON.parse).then(function (obj) {
                            for (let res of obj.result) {
                                if (res.Course) {
                                    let c: any = {};
                                    c[id + '_uuid'] = res.id.toString();
                                    c[id + '_id'] = res.Course;
                                    c[id + '_dept'] = res.Subject;
                                    c[id + '_title'] = res.Title;
                                    c[id + '_avg'] = res.Avg;
                                    c[id + '_instructor'] = res.Professor;
                                    c[id + '_pass'] = res.Pass;
                                    c[id + '_fail'] = res.Fail;
                                    c[id + '_audit'] = res.Audit;
                                    c[id + '_year'] = res.Section == "overall" ? 1900 : parseInt(res.Year);
                                    c[id + '_size'] = res.Pass + res.Fail + res.Audit;
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

                else
                    reject(new Error('Invalid id of dataset added'));
            }).catch(function (err: Error) {
                reject(err);
            });
        });
    }

    private HttpGet(r: any, id: string): Promise<GeoResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let http = require('http');
            let url = r[id + '_address'];
            url = "http://skaha.cs.ubc.ca:11316/api/v1/team198/".concat(encodeURIComponent(url));
            http.get(url, (res: any) => {
                let body = "";
                res.on('data', (chunk: any) => {
                    body += chunk;
                });
                res.on('end', () => {
                    body = body.trim();
                    let res: GeoResponse = {};

                    if (body.indexOf("\"lat\":") > -1) {
                        res.lat = parseFloat(body.substring(body.indexOf("\"lat\":") + 6, body.indexOf(",")));
                    }
                    if (body.indexOf("\"lon\":") > -1) {
                        res.lon = parseFloat(body.substring(body.indexOf("\"lon\":") + 6, body.indexOf("}")));
                    }
                    if (body.indexOf("\"error\":") > -1) {
                        res.error = (body.substring(body.indexOf(":") + 2, body.indexOf("}") - 1));
                    }
                    fulfill(res);
                });
            }).on('error', (e: Error) => {
                Log.error(e.message);
                reject(e);
            })
        });
    }

    private processNode(node: any, id: string): Object {
        let r: any = {};
        let str: string;

        if(node.attrs[0].value == 'views-field views-field-field-building-code') {
            str = node.childNodes[0].value;
            r[id + '_shortname'] = str.substring(str.indexOf('\n')+2).trim();
        }

        else if(node.attrs[0].value == 'views-field views-field-title') {
            node = node.childNodes[1];
            str = node.attrs[0].value;
            r['href'] = str.substring(str.indexOf('./')+2);
            r[id + '_fullname'] = node.childNodes[0].value;
        }

        else if(node.attrs[0].value == 'views-field views-field-field-building-address') {
            str = node.childNodes[0].value;
            r[id + '_address'] = str.substring(str.indexOf('\n')+2).trim();
        }

        else if(node.attrs[0].value == 'views-field views-field-field-room-number') {
            node = node.childNodes[1];
            if(node.attrs[0].name == 'href')
                r[id + '_href'] = node.attrs[0].value;
            r[id + '_number'] = node.childNodes[0].value;
        }

        else if(node.attrs[0].value == 'views-field views-field-field-room-capacity') {
            str = node.childNodes[0].value;
            r[id + '_seats'] = parseInt(str.substring(str.indexOf('\n')+2).trim());
        }

        else if(node.attrs[0].value == 'views-field views-field-field-room-furniture') {
            str = node.childNodes[0].value;
            r[id + '_furniture'] = str.substring(str.indexOf('\n')+2).trim();
        }

        else if(node.attrs[0].value == 'views-field views-field-field-room-type') {
            str = node.childNodes[0].value;
            r[id + '_type'] = str.substring(str.indexOf('\n')+2).trim();
        }

        return r;
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
}
