/**
 * Created by jaysinghchauhan on 3/12/17.
 */
import restify = require('restify');
import fs = require('fs');
import InsightFacade from "../controller/InsightFacade";
import {InsightResponse, QueryRequest} from "../controller/IInsightFacade";
import Log from "../Util";

export default class HandleServer {
    private static inf = new InsightFacade();

    public static gotoHome(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/index.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(400);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static gotoCourses(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/course_explorer.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(400);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static gotoRooms(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/room_explorer.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(400);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static gotoScheduler(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/schedule.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(400);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static gotoTryMe(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/tryme.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(400);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            let id = req.params.id;

            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                buffer.push(chunk);
            });

            req.once('end', function () {
                req.body = Buffer.concat(buffer).toString('base64');
                HandleServer.inf.addDataset(id, req.body).then(function (resp: InsightResponse) {
                    res.json(resp.code,resp.body);
                }).catch(function (err: InsightResponse) {
                    res.json(err.code,err.body );
                });
            });
        }
        catch(err) {
            res.send(400, {err: err.message});
        }
        return next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        let query: QueryRequest = req.params;
        HandleServer.inf.performQuery(query).then(function(resp: InsightResponse){
            res.json(resp.code,resp.body);
        }).catch(function (err: InsightResponse) {
            res.json(err.code,err.body);
        });
        return next();
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            let id = req.params.id;

            HandleServer.inf.removeDataset(id).then(function (resp: InsightResponse) {
                res.json(resp.code,resp.body);
            }).catch(function (err: InsightResponse) {
                res.json(err.code,err.body );
            });
        }
        catch(err) {
            res.send(400, {err: err.message});
        }
        return next();
    }
}