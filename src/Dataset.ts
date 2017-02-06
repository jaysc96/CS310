import Log from "./Util";
/**
 * Created by jaysinghchauhan on 2/2/17.
 */

export default class Dataset {
    data: any[] = [];

    add(data: any) {
        this.data.push(data);
    }

    merge(filter: string): Dataset {
        let set: Dataset;
        try {
            if (typeof this.data[0] != "Dataset" && this.data.length != 2)
                throw new Error;
            let set1 = this.data[0];
            let set2 = this.data[1];
            if (filter == "AND") {
                for (let obj of set1) {
                    if (set2.contains(obj.id)) {
                        set.add(obj);
                    }
                }
            }
            else {
                for (let obj of set1) {
                    if (!set2.contains(obj.id)) {
                        set.add(obj);
                    }
                }
                for (let obj of set2) {
                    set.add(obj);
                }
            }
        }
        catch (err) {
            Log.error("Cannot merge on non-dataset array of more than 2 elements");
            return null;
        }
    }

    contains(id: string): boolean {
        for (let data of this.data) {
            if (data.id == id)
                return true;
        }
        return false;
    }
}