import Dataset from "./Dataset";
import {Struct} from "./controller/InsightFacade";
/**
 * Created by jaysinghchauhan on 2/6/17.
 */
export interface Query {
    [key: string]: any
}

export interface Where {
    AND?: Where[],
    OR?: Where[],
    GT?: Query,
    LT?: Query,
    EQ?: Query,
    IS?: Query,
    NOT?: Where
}

export interface Options {
    COLUMNS: string[],
    ORDER: string,
    FORM: string
}

export interface QueryResponse {
    render: string;
    result: any[];
}

export default class Querying {
    public dataSet: Dataset;
    public id: string;
    public err: any;

    constructor(data: Struct, id: string) {
        this.dataSet = data[id];
        this.id = id;
        this.err = {missing: []};
    }

    public getWhere(where: Where): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                if (where.hasOwnProperty("AND")) {
                    that.filterAND(where.AND).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("OR")) {
                    that.filterOR(where.OR).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("GT")) {
                    that.filterGT(where.GT).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("LT")) {
                    that.filterLT(where.LT).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("EQ")) {
                    that.filterEQ(where.EQ).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("IS")) {
                    that.filterIS(where.IS).then(function(dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        fulfill(dset);
                    }).catch(reject);
                }
                else if (where.hasOwnProperty("NOT")) {
                    that.getWhere(where.NOT).then(function (dset) {
                        if (that.err.missing.length != 0)
                            reject(that.err);
                        let set = new Dataset();
                        set.data = that.dataSet.data;
                        dset.data = that.negation(dset.data, set.data);
                        fulfill(dset);
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                else {
                    reject(new Error("Invalid query"));
                }
            }
            catch(err) {
                reject(err);
            }
        });
    }

    private filterAND(and: Where[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
            if (and.length == 0)
                reject(new Error("Empty AND"));
            for (let q of and) {
                pr.push(that.getWhere(q));
            }
            Promise.all(pr).then(function (set: Dataset[]) {
                if(set.length == 2) {
                    let data1: any[] = set[0].data;
                    let data2: any[] = set[1].data;
                    let data = that.intersection(data1, data2);
                    let dset = new Dataset();
                    dset.data = data;
                    fulfill(dset);
                }
            }).catch (function (err) {
                reject(err);
            });
        });
    }

    private filterOR(or: Where[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
            if (or.length == 0)
                reject(new Error("Empty OR"));
            for (let q of or) {
                pr.push(that.getWhere(q));
            }
            Promise.all(pr).then(function (set: Dataset[]) {
                if(set.length == 2) {
                    let data1: any[] = set[0].data;
                    let data2: any[] = set[1].data;
                    let data = that.union(data1, data2);
                    let dset = new Dataset();
                    dset.data = data;
                    fulfill(dset);
                }
            }).catch (function (err) {
                reject(err);
            });
        });
    }

    private filterGT(gt: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let keys = Object.keys(gt);
                if(keys.length != 1)
                    reject(new Error("Invalid GT"));
                let data: any[];
                let key = keys[0];
                let id = key.split('_')[0];
                if (id != that.id) {
                    that.err.missing.push(id);
                    reject(that.err);
                }
                else
                    data = that.dataSet.data;
                let bound = gt[key];
                if (typeof bound !== 'number')
                    reject(new Error("Invalid GT"));
                for (let obj of data) {
                    if (!obj.hasOwnProperty(key))
                        reject(new Error("Invalid GT key"));
                    if (obj[key] > bound)
                        set.add(obj);
                }
                fulfill(set);
            }
            catch(err) {
                reject(err);
            }
        });
    }

    private filterLT(lt: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let keys = Object.keys(lt);
                if(keys.length != 1)
                    reject(new Error("Invalid LT"));
                let key = keys[0];
                let bound = lt[key];
                let data: any[];
                let id = key.split('_')[0];
                if (id != that.id) {
                    that.err.missing.push(id);
                    reject(that.err);
                }
                else
                    data = that.dataSet.data;
                if (typeof bound !== 'number')
                    reject(new Error("Invalid LT"));
                for (let obj of data) {
                    if (!obj.hasOwnProperty(key))
                        reject(new Error("Invalid LT key"));
                    if (obj[key] < bound)
                        set.add(obj);
                }
                fulfill(set);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    private filterEQ(eq: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let keys = Object.keys(eq);
                if(keys.length != 1)
                    reject(new Error("Invalid EQ"));
                let key = keys[0];
                let bound = eq[key];
                let data: any[];
                let id = key.split('_')[0];
                if (id != that.id){
                    that.err.missing.push(id);
                    reject(that.err);
                }
                else
                    data = that.dataSet.data;
                if (typeof bound !== 'number')
                    reject(new Error("Invalid EQ"));
                for (let obj of data) {
                    if (!obj.hasOwnProperty(key))
                        reject(new Error("Invalid EQ key"));
                    if (obj[key] == bound)
                        set.add(obj);
                }
                fulfill(set);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    private filterIS(is: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let keys = Object.keys(is);

                if(keys.length != 1)
                    reject(new Error("Invalid IS"));

                let key = keys[0];
                let val = is[key];
                let id = key.split('_')[0];
                let data: any[];

                if (id != that.id){
                    that.err.missing.push(id);
                    reject(that.err);
                }
                else
                    data = that.dataSet.data;

                if (typeof val !== 'string')
                    reject(new Error("Invalid IS"));
                else if(val.includes('*'))
                    fulfill(that.filterPartial(is));
                else {
                    for (let obj of data) {
                        if (!obj.hasOwnProperty(key))
                            reject(new Error("Invalid IS key"));
                        else if (obj[key].includes(val))
                            set.add(obj);
                    }
                    fulfill(set);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }

    private filterPartial(is: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let key = Object.keys(is)[0];
            let str = is[key];
            let data = that.dataSet.data;
            let pos: string;
            let set = new Dataset();

            if(str.indexOf('*') == str.lastIndexOf('*')) {
                if(str.indexOf('*') == 0) {
                    str = str.substring(str.indexOf('*')+1);
                    pos = 'front';
                }
                else {
                    str = str.substring(0, str.indexOf('*'));
                    pos = 'back';
                }
            }
            else {
                str = str.substring(str.indexOf('*')+1, str.lastIndexOf('*'));
                pos = 'both';
            }

            for(let obj of data) {
                if(obj[key].includes(str)) {
                    if(pos == "front") {
                        if(obj[key].indexOf(str) == (obj[key].length-str.length))
                            set.add(obj);
                    }
                    else if(pos == "back") {
                        if(obj[key].indexOf(str) == 0)
                            set.add(obj);
                    }
                    else
                        set.add(obj);
                }
            }
            fulfill(set);
        })
    }

    private union(d1: any[], d2: any[]): any[] {
        for (let obj of d1) {
            if (!d2.includes(obj)) {
                d2.push(obj);
            }
        }
        return d2;
    }

    private intersection(d1: any[], d2: any[]): any[] {
        return d1.filter(x => d2.indexOf(x) !== -1);
    }

    private negation(d: any[], universal: any[]): any[] {
        let D = universal.slice();
        for (let obj of d) {
            let ind = D.findIndex(function (element) {
                return element == obj;
            });
            D.splice(ind, 1);
        }
        return D;
    }
}