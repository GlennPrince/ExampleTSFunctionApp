import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as AzureStorage from "azure-storage"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Update Task Triggered');

    if(!req.body.username || req.body.username === ""){
        context.res.status(400).json({ error: "No Username Defined" });
        return;
    }
    
    if(!req.body.taskID || req.body.taskID === ""){
        context.res.status(400).json({ error: "No Task ID Defined" });
        return;
    }

    var tableSvc = AzureStorage.createTableService();
    var tableName = "Tasks";
    
    var entGen = AzureStorage.TableUtilities.entityGenerator;
    var task = {
        PartitionKey: entGen.String(req.body.username),
        RowKey: entGen.String(req.body.taskID),
        name: entGen.String(req.body.name),
        dueDate: entGen.DateTime(new Date(Date.UTC(req.body.dueYear, req.body.dueMonth, req.body.dueDay))),
        completed: entGen.String(req.body.completed)
    };
    
    try{
        var result = await apiFunctionWrapper(tableSvc, tableName, task);
        context.res.status(201).json({ "taskId": req.body.taskID, "result": result });
    } catch(error){
        context.res.status(500).json({ "taskId": req.body.taskID, "error": error });
    }
};

export default httpTrigger;

function apiFunctionWrapper(tableSvc, tableName, task) {
    return new Promise((res,err) => {
        tableSvc.replaceEntity(tableName, task, function (error, result) {
            if (!error) {
                return res(result);
            } else {
                return err(error);
            }
        });
    });
}