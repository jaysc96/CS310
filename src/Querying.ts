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
    ORDER?: Order|string,
    FORM: string
}

export interface Order {
    dir: 'UP'|'DOWN',
    keys: string[]
}

export interface Transformations {
    GROUP: string[]
    APPLY: Apply[]
}

export interface Apply {
    [id: string]: {[id: string]: string}
}

export interface QueryResponse {
    render: string;
    result: any[];
}

export default class Querying {
    public dataSet: Dataset;
    public id: string;
    private err: any;

    constructor(data: Struct, id: string) {
        this.dataSet = data[id];
        this.id = id;
        this.err = {missing: []};
    }

    public getWhere(where: Where): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                if(Object.keys(where).length == 0)
                    fulfill(that.dataSet);
                else if (where.hasOwnProperty("AND")) {
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
                        dset.data = that.negation(dset.data, that.dataSet.data);
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

    public renderOptions(opt: Options, set: Dataset): Promise<QueryResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let columns = opt.COLUMNS;
                let form = opt.FORM;
                let order: any;

                if (columns.length == 0)
                    reject(new Error ("Empty COLUMNS"));
                else {
                    let err: {missing: string[]} = {missing: []};
                    for (let col of columns) {
                        if(col.indexOf('_') != -1) {
                            let key = col.split('_')[0];
                            if (key != that.id)
                                err.missing.push(key);
                        }
                    }
                    if(err.missing.length > 0) {
                        reject(err);
                    }
                }

                if(opt.hasOwnProperty('ORDER')) {
                    order = opt.ORDER;
                    if(typeof order == 'string') {
                        if (!columns.includes(order)) {
                            reject(new Error("ORDER should be present in COLUMNS"));
                        }
                        else {
                            if (set.data.length == 0)
                                fulfill({render: form, result: []});
                            try {
                                if (typeof set.data[0][order] == 'number') {
                                    set.data.sort(function (a, b) {
                                        return a[order] - b[order];
                                    });
                                }
                                else if (typeof set.data[0][order] == 'string') {
                                    set.data.sort(function (a, b) {
                                        return a[order] == b[order] ? 0 : a[order] < b[order] ? -1 : 1;
                                    });
                                }
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    }
                    else {
                        let dir = order.dir;
                        let keys = order.keys;
                        let key = keys[0];
                        if(!columns.includes(key)) {
                            reject(new Error("ORDER should be present in COLUMNS"));
                        }
                        else {
                            if(typeof set.data[0][key] == 'number') {
                                set.data.sort((a, b) => {
                                    if (a[key] == b[key]) {
                                        for(let j=1; j<keys.length; j++) {
                                            if(a[keys[j]] != b[keys[j]]) {
                                                key = keys[j];
                                                break;
                                            }
                                        }
                                    }
                                    if(dir == 'DOWN')
                                        return b[key] - a[key];
                                    else
                                        return a[key] - b[key];
                                });
                            }

                            else {
                                set.data.sort((a, b) => {
                                    if (a[key] == b[key]) {
                                        for(let j=1; j<keys.length; j++) {
                                            if(a[keys[j]] != b[keys[j]]) {
                                                key = keys[j];
                                                break;
                                            }
                                        }
                                    }
                                    if(dir == 'DOWN')
                                        return a[key] > b[key] ? -1 : 1;
                                    else
                                        return a[key] < b[key] ? -1 : 1;
                                });
                            }
                        }
                    }
                }

                if(form == "TABLE") {
                    let render = form;
                    let result: any[] = [];
                    if(set.data.length == 0)
                        fulfill({render: render, result: result});
                    else {
                        for (let data of set.data) {
                            let c: any = {};
                            for (let col of columns) {
                                if (data.hasOwnProperty(col))
                                    c[col] = data[col];
                            }
                            if (Object.keys(c).length == columns.length)
                                result.push(c);
                        }
                        if (result.length == 0)
                            reject(new Error("Invalid COLUMNS"));
                        let qr: QueryResponse = {render: render, result: result};
                        fulfill(qr);
                    }
                }
                else
                    reject(new Error("Invalid FORM"));
            }
            catch (err) {
                reject(err);
            }
        })
    }

    public transform(tr: Transformations, opt: Options, set: Dataset): Dataset {
        let dset = new Dataset();
        let cols = opt.COLUMNS;
        let order: any;

        if(opt.ORDER)
            order = opt.ORDER;
        let grp = tr.GROUP;
        let apply = tr.APPLY;

        if(grp.length == 0)
            throw new Error('Empty GROUPS');

        let apkeys = apply.map(x => {
            return Object.keys(x)[0];
        });

        let aptkns = apply.map((x,i) => {
            return Object.keys(x[apkeys[i]])[0];
        });

        let aptknkeys = apply.map((x, i) => {
            return x[apkeys[i]][aptkns[i]];
        });

        for(let col of cols) {
            if(col.indexOf('_') == -1) {
                if (!apkeys.includes(col))
                    throw new Error('COLUMNS should have keys present in APPLY');
            }

            else {
                if (!grp.includes(col)) {
                    console.log(col.indexOf('_'));
                    throw new Error('COLUMNS should have keys present in GROUP');
                }
            }
        }

        if(set.data.length == 0)
            return set;
        let arr: any;
        try {
            arr = this.groupData(set.data, grp, 0, apkeys, aptkns, aptknkeys, []);
        }
        catch(err) {
            throw err;
        }

        if(grp.length == 1)
            dset.data = arr;
        else {
            dset.data = this.flattenArray(arr, []);
        }
        return dset;
    }


    private flattenArray(arr1: any[], arr2: any[]): any[] {
        for(let a of arr1) {
            if(a.isArray())
                arr2.concat(this.flattenArray(a, arr2));
            else
                arr2.push(arr1);
        }
        return arr2;
    }

    private groupData(data: any[], grp: string[], i: number, apkeys: string[], aptkns: string[], aptknkeys: string[], obj: any[]): any {
        try {
            if (i == grp.length) {
                return this.applyToGroup(data, apkeys, aptkns, aptknkeys);
            }
            else {
                let g = grp[i];
                let d: any[] = [];

                for (let o of data) {
                    if (!d.includes(o[g]))
                        d.push(o[g]);
                }

                for (let val of d) {
                    let grp_data = data.filter(x => {
                        return x[g] == val;
                    });

                    grp_data = grp_data.map(x => {
                        let o: any = {};
                        for (let g of grp) {
                            o[g] = x[g];
                        }
                        for (let key of aptknkeys) {
                            o[key] = x[key];
                        }
                        return o;
                    });

                    obj.push(this.groupData(grp_data, grp, i + 1, apkeys, aptkns, aptknkeys, obj));
                }
                return obj;
            }
        }
        catch(err) {
            throw err;
        }
    }

    private applyToGroup(data: any[], apkeys: string[], aptkns: string[], aptknkeys: string[]): any {
        let c: any = {};
        for(let i in apkeys) {

            if(aptkns[i] == 'MAX') {
                if (typeof data[0][aptknkeys[i]] == 'number') {
                    data = data.sort((a, b) => {
                        return a[aptknkeys[i]] - b[aptknkeys[i]];
                    });
                    let d = data[0];
                    d[apkeys[i]] = d[aptknkeys[i]];
                    Object.assign(c, d);
                }
                else
                    throw new Error("To apply MAX keyvalue should be a number");
            }

            else if(aptkns[i] == 'MIN') {
                if (typeof data[0][aptknkeys[i]] == 'number') {
                    data = data.sort((a, b) => {
                        return b[aptknkeys[i]] - a[aptknkeys[i]];
                    });
                    let d = data[0];
                    d[apkeys[i]] = d[aptknkeys[i]];
                    Object.assign(c, d);
                }
                else
                    throw new Error("To apply MIN keyvalue should be a number");
            }

            else if(aptkns[i] == 'SUM'||'AVG') {
                if (typeof data[0][aptknkeys[i]] == 'number') {
                    let sum: number;
                    for(let obj of data) {
                        sum += obj[aptknkeys[i]];
                    }
                    Object.assign(c, data[0]);
                    if(aptkns[i] == 'SUM')
                        c[apkeys[i]] = Number(sum.toFixed(0));
                    else {
                        let avg = sum/data.length;
                        c[apkeys[i]] = Number(avg.toFixed(2));
                    }
                }
                else
                    throw new Error("To apply SUM or AVG keyvalue should be a number");
            }

            else if(aptkns[i] == 'COUNT') {

            }

            else
                throw new Error("Invalid Apply Token");
        }
        return c;
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
            Promise.all(pr).then(function (sets: Dataset[]) {
                if(sets.length == and.length) {
                    let data: any[] = sets[0].data;
                    for(let set of sets) {
                        data = that.intersection(data, set.data);
                    }
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
            Promise.all(pr).then(function (sets: Dataset[]) {
                if(sets.length == or.length) {
                    let data: any[] = sets[0].data;
                    for(let set of sets) {
                        data = that.union(data, set.data);
                    }
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
                    if(!that.isValidId(id)) {
                        that.err.missing.push(id);
                        reject(that.err);
                    }
                    else
                        reject(new Error("Querying on multiple keys in dataset is not valid"));
                }
                else
                    data = that.dataSet.data;

                let bound = gt[key];
                if (typeof bound !== 'number')
                    reject(new Error("Invalid GT"));
                else {
                    let flag = 1;
                    for (let obj of data) {
                        if (obj.hasOwnProperty(key))
                            if(typeof obj[key] === 'number') {
                                flag = 0;
                                if (obj[key] > bound)
                                    set.add(obj);
                            }
                    }
                    if (flag == 0)
                        fulfill(set);
                    else
                        reject(new Error("Invalid LT key"));
                }
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
                    if(!that.isValidId(id)) {
                        that.err.missing.push(id);
                        reject(that.err);
                    }
                    else
                        reject(new Error("Querying on multiple keys in dataset is not valid"));
                }
                else
                    data = that.dataSet.data;

                if (typeof bound !== 'number')
                    reject(new Error("Invalid LT"));
                else {
                    let flag = 1;
                    for (let obj of data) {
                        if (obj.hasOwnProperty(key))
                            if(typeof obj[key] === 'number') {
                                flag = 0;
                                if (obj[key] < bound)
                                    set.add(obj);
                            }
                    }

                    if (flag == 0)
                        fulfill(set);
                    else
                        reject(new Error("Invalid LT key"));
                }
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
                    if(!that.isValidId(id)) {
                        that.err.missing.push(id);
                        reject(that.err);
                    }
                    else
                        reject(new Error("Querying on multiple keys in dataset is not valid"));
                }
                else
                    data = that.dataSet.data;

                if (typeof bound !== 'number')
                    reject(new Error("Invalid EQ"));
                else {
                    let flag = 1;
                    for (let obj of data) {
                        if (obj.hasOwnProperty(key))
                            if(typeof obj[key] === 'number') {
                                flag = 0;
                                if (obj[key] == bound)
                                    set.add(obj);
                            }
                    }
                    if (flag == 0)
                        fulfill(set);
                    else
                        reject(new Error("Invalid EQ key"));
                }
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
                    if(!that.isValidId(id)) {
                        that.err.missing.push(id);
                        reject(that.err);
                    }
                    else
                        reject(new Error("Querying on multiple keys in dataset is not valid"));
                }
                else
                    data = that.dataSet.data;

                if (typeof val !== 'string')
                    reject(new Error("Invalid IS"));
                else if(val.includes('*'))
                    fulfill(that.filterPartial(is));
                else {
                    let flag = 1;
                    for (let obj of data) {
                        if (obj.hasOwnProperty(key))
                            if(typeof obj[key] === 'string') {
                                flag = 0;
                                if (obj[key] == val)
                                    set.add(obj);
                            }
                    }
                    if(flag == 0)
                        fulfill(set);
                    else
                        reject(new Error("Invalid IS"));
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
            try {
                let key = Object.keys(is)[0];
                let str = is[key];
                let data = that.dataSet.data;
                let pos: string;
                let set = new Dataset();

                if (str.indexOf('*') == str.lastIndexOf('*')) {
                    if (str.indexOf('*') == 0) {
                        if (str.length == 1)
                            reject(new Error("Invalid IS"));
                        str = str.substring(str.indexOf('*') + 1);
                        pos = 'front';
                    }
                    else {
                        str = str.substring(0, str.indexOf('*'));
                        pos = 'back';
                    }
                }

                else {
                    str = str.substring(str.indexOf('*') + 1, str.lastIndexOf('*'));
                    pos = 'both';
                }

                let flag = 1;
                for (let obj of data) {
                    if (obj.hasOwnProperty(key))
                        if(typeof obj[key] === 'string') {
                            flag = 0;
                            if (obj[key].includes(str)) {
                                if (pos == "front") {
                                    if (obj[key].indexOf(str) == (obj[key].length - str.length))
                                        set.add(obj);
                                }
                                else if (pos == "back") {
                                    if (obj[key].indexOf(str) == 0)
                                        set.add(obj);
                                }
                                else if (pos == "both")
                                    set.add(obj);
                            }
                        }
                }

                if (flag == 0)
                    fulfill(set);
                else
                    reject(new Error("Invalid IS key"));
            }
            catch(err) {
                reject(err);
            }
        })
    }

    private isValidId(id: string): boolean {
        return id == 'rooms' || id == 'courses';
    }

    private union(d1: any[], d2: any[]): any[] {
        return d1.concat(d2.filter(x => d1.indexOf(x) === -1));
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