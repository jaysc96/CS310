import Dataset from "./Dataset";
/**
 * Created by jaysinghchauhan on 2/6/17.
 */
export interface Query {
    [key: string]: any
}

export interface Where {
    "AND"?: any[2],
    "OR"?: any[2],
    "GT"?: Query,
    "LT"?: Query,
    "EQ"?: Query,
    "IS"?: Query,
    "NOT"?: Query
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
            }
            catch(err) {
                reject (err);
            }
        });
    }

    filterAND(and: any[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
            for (let q of and) {
                if (q.hasOwnProperty("AND")) {
                    pr.push(that.filterAND(q.AND));
                }
                else if (q.hasOwnProperty("OR")) {
                    pr.push(that.filterOR(q.OR));
                }
                else if (q.hasOwnProperty("GT")) {
                    pr.push(that.filterGT(q.GT));
                }
                else if (q.hasOwnProperty("LT")) {
                    pr.push(that.filterLT(q.LT));
                }
                else if (q.hasOwnProperty("EQ")) {
                    pr.push(that.filterEQ(q.EQ));
                }
                else if (q.hasOwnProperty("IS")) {
                    pr.push(that.filterIS(q.IS));
                }
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

    filterOR(or: any[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let pr: Promise<Dataset>[] = [];
            for (let q of or) {
                if (q.hasOwnProperty("AND")) {
                    pr.push(that.filterAND(q.AND));
                }
                else if (q.hasOwnProperty("OR")) {
                    pr.push(that.filterOR(q.OR));
                }
                else if (q.hasOwnProperty("GT")) {
                    pr.push(that.filterGT(q.GT));
                }
                else if (q.hasOwnProperty("LT")) {
                    pr.push(that.filterLT(q.LT));
                }
                else if (q.hasOwnProperty("EQ")) {
                    pr.push(that.filterEQ(q.EQ));
                }
                else if (q.hasOwnProperty("IS")) {
                    pr.push(that.filterIS(q.IS));
                }
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
            let set = new Dataset();
            let data = that.dataSet.data;
            let key = Object.keys(gt)[0];
            let bound = gt[key];
            for (let obj of data) {
                if(obj[key] > bound) {
                    set.add(obj);
                }
            }
            fulfill(set);
        });
    }

    filterLT(lt: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let set = new Dataset();
            let data = that.dataSet.data;
            let key = Object.keys(lt)[0];
            let bound = lt[key];
            for (let obj of data) {
                if(obj[key] < bound) {
                    set.add(obj);
                }
            }
            fulfill(set);
        });
    }

    filterEQ(eq: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let set = new Dataset();
            let data = that.dataSet.data;
            let key = Object.keys(eq)[0];
            let bound = eq[key];
            for (let obj of data) {
                if(obj[key] == bound) {
                    set.add(obj);
                }
            }
            fulfill(set);
        });
    }

    filterIS(is: Query): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let set = new Dataset();
            let data = that.dataSet.data;
            let key = Object.keys(is)[0];
            let val = is[key];
            for (let obj of data) {
                if(obj[key] == val) {
                    set.add(obj);
                }
            }
            fulfill(set);
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
}