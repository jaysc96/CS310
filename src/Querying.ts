import Dataset from "./Dataset";
/**
 * Created by jaysinghchauhan on 2/6/17.
 */
export interface Query {
    [key: string]: any
}

export interface Where {
    "AND"?: Where[],
    "OR"?: Where[],
    "GT"?: Query,
    "LT"?: Query,
    "EQ"?: Query,
    "IS"?: Query,
    "NOT"?: Where
}

export interface Options {
    "COLUMNS": string[],
    "ORDER": string,
    "FORM": string
}

export interface QueryResponse {
    render: string;
    result: any[];
}

export default class Querying {
    public dataSet: Dataset;

    constructor(data: Dataset) {
        this.dataSet = data;
    }

    getWhere(where: Where): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                if (where.hasOwnProperty("AND")) {
                    fulfill(that.filterAND(where.AND));
                }
                else if (where.hasOwnProperty("OR")) {
                    fulfill(that.filterOR(where.OR));
                }
                else if (where.hasOwnProperty("GT")) {
                    fulfill(that.filterGT(where.GT));
                }
                else if (where.hasOwnProperty("LT")) {
                    fulfill(that.filterLT(where.LT));
                }
                else if (where.hasOwnProperty("EQ")) {
                    fulfill(that.filterEQ(where.EQ));
                }
                else if (where.hasOwnProperty("IS")) {
                    fulfill(that.filterIS(where.IS));
                }
                else if (where.hasOwnProperty("NOT")) {
                    that.getWhere(where.NOT).then(function (dset) {
                        let set = new Dataset();
                        set.data = that.dataSet.data;
                        dset.data = that.negation(dset.data, set.data);
                        fulfill(dset);
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                else {
                    throw new Error("Invalid query");
                }
            }
            catch(err) {
                reject(err);
            }
        });
    }

    filterAND(and: Where[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
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

    filterOR(or: Where[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
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

    filterGT(gt: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let data = that.dataSet.data;
                let keys = Object.keys(gt);
                if(keys.length != 1)
                    reject(new Error("Invalid query"));
                let key = keys[0];
                let bound = gt[key];
                for (let obj of data) {
                    if (obj[key] > bound) {
                        set.add(obj);
                    }
                }
                fulfill(set);
            }
            catch(err) {
                reject(err);
            }
        });
    }

    filterLT(lt: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let data = that.dataSet.data;
                let keys = Object.keys(lt);
                if(keys.length != 1)
                    reject(new Error("Invalid query"));
                let key = keys[0];
                let bound = lt[key];
                for (let obj of data) {
                    if (obj[key] < bound) {
                        set.add(obj);
                    }
                }
                fulfill(set);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    filterEQ(eq: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let data = that.dataSet.data;
                let keys = Object.keys(eq);
                if(keys.length != 1)
                    reject(new Error("Invalid query"));
                let key = keys[0];
                let bound = eq[key];
                for (let obj of data) {
                    if (obj[key] == bound) {
                        set.add(obj);
                    }
                }
                fulfill(set);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    filterIS(is: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let set = new Dataset();
                let data = that.dataSet.data;
                let keys = Object.keys(is);
                if(keys.length != 1)
                    reject(new Error("Invalid query"));
                let key = keys[0];
                let val = is[key];
                for (let obj of data) {
                    if (obj[key] == val) {
                        set.add(obj);
                    }
                }
                if(set.data.length == 0)
                    throw new Error("missing: "+key);
                fulfill(set);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    union(d1: any[], d2:any[]): any[] {
        let d: any[] = [];
        for (let obj of d1) {
            if (!d2.includes(obj)) {
                d.push(obj);
            }
        }
        for (let obj of d2) {
            d.push(obj);
        }
        return d;
    }

    intersection(d1: any[], d2: any[]): any[] {
        let d: any[] = [];
        for (let obj of d1) {
            if (d2.includes(obj)) {
                d.push(obj);
            }
        }
        return d;
    }

    negation(d: any[], universal: any[]): any[] {
        let D = universal.slice();
        for (let obj of d) {
            let ind = D.findIndex(function (element) {
                return element == obj;
            });
            D.splice(ind, 1);
        }
        if (D.length == 0)
            throw new Error("No dataset present");
        return D;
    }
}