import Log from "./Util";
/**
 * Created by jaysinghchauhan on 2/2/17.
 */

export default class Dataset {
    data: any[] = [];

    add(data: any) {
        this.data.push(data);
    }

    merge(filter: string): Promise<Dataset> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let set = new Dataset();
            try {
                if (typeof that.data[0] != "Dataset" && that.data.length != 2)
                    throw new Error;
                let set1 = that.data[0];
                let set2 = that.data[1];
                if (filter == "AND") {
                    for (let obj of set1.data) {
                        if (set2.contains(obj['courses_id'])) {
                            set.add(obj);
                        }
                    }
                    fulfill(set);
                }
                else {
                    for (let obj of set1.data) {
                        if (!set2.contains(obj['courses_id'])) {
                            set.add(obj);
                        }
                    }
                    for (let obj of set2.data) {
                        set.add(obj);
                    }
                    fulfill(set);
                }
            }
            catch (err) {
                Log.error("Cannot merge on non-dataset array of more than 2 elements");
                reject(err);
            }
        });
    }

    contains(id: string): boolean {
        for (let data of this.data) {
            if (data['course_id'] == id)
                return true;
        }
        return false;
    }
}