/**
 * Created by jaysinghchauhan on 3/12/17.
 */
import restify = require('restify');
import InsightFacade from "../controller/InsightFacade";
import {InsightResponse, QueryRequest} from "../controller/IInsightFacade";

export default class HandleServer {
    private inf = new InsightFacade();

    public getIt(req: restify.Request, res: restify.Response, next: restify.Next) {

    }

    public putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            let id = req.params.id;

            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                buffer.push(chunk);
            });

            req.once('end', function () {
                req.body = Buffer.concat(buffer).toString('base64');
                this.inf.addDataset(id, req.body).then(function (resp: InsightResponse) {
                    res.send(resp.code,resp.body);
                }).catch(function (err: InsightResponse) {
                    res.send(err.code,err.body );
                });
            });
        }
        catch(err) {
            res.send(400, {err: err.message});
        }
        return next();
    }

    public postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        let query: QueryRequest = req.params;
        this.inf.performQuery(query).then(function(resp: InsightResponse){
            res.send(resp.code,resp.body);
        }).catch(function (err: InsightResponse) {
            res.send(err.code,err.body);
        });
        return next();
    }

    public deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            let id = req.params.id;

            this.inf.removeDataset(id).then(function (resp: InsightResponse) {
                res.send(resp.code,resp.body);
            }).catch(function (err: InsightResponse) {
                res.send(err.code,err.body );
            });
        }
        catch(err) {
            res.send(400, {err: err.message});
        }
        return next();
    }
}