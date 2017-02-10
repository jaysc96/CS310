import Log from "./Util";
/**
 * Created by jaysinghchauhan on 2/2/17.
 */

export default class Dataset {
    data: any[] = [];

    add(data: any) {
        this.data.push(data);
    }
}