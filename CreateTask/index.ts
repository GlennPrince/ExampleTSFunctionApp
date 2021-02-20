import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as AzureStorage from "azure-storage"
import { Guid } from "guid-typescript";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Create Task Triggered');

    if(!req.body.username || req.body.username === ""){
        context.res.status(400).json({ error: "No Username Defined" });
        return;
    }

    var tableSvc = AzureStorage.createTableService();
    var tableName = "Tasks";

    var taskID = Guid.create().toString();
    
    var entGen = AzureStorage.TableUtilities.entityGenerator;
    var task = {
        PartitionKey: entGen.String(req.body.username),
        RowKey: entGen.String(taskID),
        name: entGen.String(req.body.name),
        dueDate: entGen.DateTime(new Date(Date.UTC(req.body.dueYear, req.body.dueMonth, req.body.dueDay))),
        completed: entGen.String(req.body.completed)
    };
    
    try{
        var result = await apiFunctionWrapper(tableSvc, tableName, task);
        return context.res.status(201).json({ "taskId": req.body.taskID, "result": result });
    } catch(error){
        context.log(error);
        return context.res.status(500).json({ taskId: req.body.taskID, error: error });
    }
};

export default httpTrigger;

function apiFunctionWrapper(tableSvc, tableName, task) {
    return new Promise((res,err) => {
        tableSvc.insertEntity(tableName, task, function (error, result) {
            if (!error) {
                return res(result);
            } else {
                return err(error);
            }
        });
    });
}