import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as AzureStorage from "azure-storage"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Task Store Triggered');

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

    await apiFunctionWrapper(tableSvc, tableName, req.body.username,  req.body.taskID).then(value => {
        context.res.status(200).json({
        username: value["PartitionKey"]._, 
        taskID: value["RowKey"]._, 
        name: value["name"]._, 
        dueDate: value["dueDate"]._, 
        completed: value["completed"]._
        });
    }, error => {
        context.log(error);
        context.res.status(500).json({ taskId: req.body.taskID, error: "TaskID does not exist for user" });
    });
};

export default httpTrigger;

function apiFunctionWrapper(tableSvc, tableName, username, taskID) {
    return new Promise((res, err) => {
        tableSvc.retrieveEntity(tableName, username,  taskID, function(error, result) {
            if (!error) {
                return res(result);
            } else {
                return err(error);
            }
        });
    });
}