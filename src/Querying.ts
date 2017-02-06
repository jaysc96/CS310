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
            let set: Dataset;
            try {
                if (where.hasOwnProperty("AND")) {
                    set = that.filterAND(where.AND);
                }
                else if (where.hasOwnProperty("OR")) {
                    set = that.filterOR(where.OR);
                }
                else if (where.hasOwnProperty("GT")) {
                    set = that.filterGT(where.GT);
                }
                else if (where.hasOwnProperty("LT")) {
                    set = that.filterLT(where.LT);
                }
                else if (where.hasOwnProperty("EQ")) {
                    set = that.filterEQ(where.EQ);
                }
                else if (where.hasOwnProperty("IS")) {
                    set = that.filterIS(where.IS);
                }
                fulfill(set);
            }
            catch(err) {
                reject (err);
            }
        });
    }

    filterAND(and: any[]): Dataset {
        let set: Dataset;
        for (let q of and) {
            if (q.hasOwnProperty("AND")) {
                set.add(this.filterAND(q));
            }
            else if (q.hasOwnProperty("OR")) {
                set.add(this.filterOR(q));
            }
            else if (q.hasOwnProperty("GT")) {
                set.add(this.filterGT(q));
            }
            else if (q.hasOwnProperty("LT")) {
                set.add(this.filterLT(q));
            }
            else if (q.hasOwnProperty("EQ")) {
                set.add(this.filterEQ(q));
            }
            else if (q.hasOwnProperty("IS")) {
                set.add(this.filterIS(q));
            }
        }
        set = set.merge("AND");
        return set;
    }

    filterOR(or: any[]): Dataset {
        let set: Dataset;
        for (let q of or) {
            if (q.hasOwnProperty("AND")) {
                set.add(this.filterAND(q));
            }
            else if (q.hasOwnProperty("OR")) {
                set.add(this.filterOR(q));
            }
            else if (q.hasOwnProperty("GT")) {
                set.add(this.filterGT(q));
            }
            else if (q.hasOwnProperty("LT")) {
                set.add(this.filterLT(q));
            }
            else if (q.hasOwnProperty("EQ")) {
                set.add(this.filterEQ(q));
            }
            else if (q.hasOwnProperty("IS")) {
                set.add(this.filterIS(q));
            }
        }
        set = set.merge("OR");
        return set;
    }

    filterGT(gt: Query): Dataset {
        let set: Dataset;
        let data = this.dataSet.data;
        let key = Object.keys(gt)[0];
        let bound = gt[key];
        for (let obj of data) {
            if(obj[key] > bound) {
                set.add(obj);
            }
        }
        return set;
    }

    filterLT(lt: Query): Dataset {
        let set: Dataset;
        let data = this.dataSet.data;
        let key = Object.keys(lt)[0];
        let bound = lt[key];
        for (let obj of data) {
            if(obj[key] < bound) {
                set.add(obj);
            }
        }
        return set;
    }

    filterEQ(eq: Query): Dataset {
        let set: Dataset;
        let data = this.dataSet.data;
        let key = Object.keys(eq)[0];
        let bound = eq[key];
        for (let obj of data) {
            if(obj[key] == bound) {
                set.add(obj);
            }
        }
        return set;
    }

    filterIS(is: Query): Dataset {
        let set: Dataset;
        let data = this.dataSet.data;
        let key = Object.keys(is)[0];
        let val = is[key];
        for (let obj of data) {
            if(obj[key] == val) {
                set.add(obj);
            }
        }
        return set;
    }
}