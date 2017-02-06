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
            let set = new Dataset();
            for (let q of and) {
                if (q.hasOwnProperty("AND")) {
                    set.add(that.filterAND(q.AND));
                }
                else if (q.hasOwnProperty("OR")) {
                    set.add(that.filterOR(q.OR));
                }
                else if (q.hasOwnProperty("GT")) {
                    set.add(that.filterGT(q.GT));
                }
                else if (q.hasOwnProperty("LT")) {
                    set.add(that.filterLT(q.LT));
                }
                else if (q.hasOwnProperty("EQ")) {
                    set.add(that.filterEQ(q.EQ));
                }
                else if (q.hasOwnProperty("IS")) {
                    set.add(that.filterIS(q.IS));
                }
            }
            fulfill(set.merge("AND"));
        });
    }

    filterOR(or: any[]): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let set = new Dataset();
            for (let q of or) {
                if (q.hasOwnProperty("AND")) {
                    set.add(that.filterAND(q.AND));
                }
                else if (q.hasOwnProperty("OR")) {
                    set.add(that.filterOR(q.OR));
                }
                else if (q.hasOwnProperty("GT")) {
                    set.add(that.filterGT(q.GT));
                }
                else if (q.hasOwnProperty("LT")) {
                    set.add(that.filterLT(q.LT));
                }
                else if (q.hasOwnProperty("EQ")) {
                    set.add(that.filterEQ(q.EQ));
                }
                else if (q.hasOwnProperty("IS")) {
                    set.add(that.filterIS(q.IS));
                }
            }
            fulfill(set.merge("OR"));
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

    filterLT(lt: Query): Dataset {
        let that = this;
        let set = new Dataset();
        let data = that.dataSet.data;
        let key = Object.keys(lt)[0];
        let bound = lt[key];
        for (let obj of data) {
            if(obj[key] < bound) {
                set.add(obj);
            }
        }
        return set;
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
}