import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as AzureStorage from "azure-storage"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Task Store Triggered');

    if(!req.body.username || req.body.username === ""){
        context.res.status(400).json({ error: "No Username Defined" });
        return;
    }

    var tableSvc = AzureStorage.createTableService();
    var tableName = "Tasks";

    var query = new AzureStorage.TableQuery().where('PartitionKey eq ?', req.body.username);
    
    await apiFunctionWrapper(tableSvc, tableName, query).then(value => {
        var formattedEntries = new Array();
        for (var i = 0; i < value["entries"].length; i++) {
            formattedEntries.push({
                username: value["entries"][i]["PartitionKey"]._,
                taskID: value["entries"][i]["RowKey"]._,
                name: value["entries"][i]["name"]._,
                dueDate: value["entries"][i]["dueDate"]._,
                completed: value["entries"][i]["completed"]._
            });
        }
        context.res.status(200).json({
            "results": formattedEntries
        }, error => {
            context.log(error);
            context.res.status(500).json({ taskId: req.body.taskID, error: "No tasks for user or error retrieving tasks" });
        });
    });
};

export default httpTrigger;

function apiFunctionWrapper(tableSvc, tableName, query) {
    return new Promise((err, res) => {
        tableSvc.queryEntities(tableName, query, null, function(result, error) {
            if (!error) {
                return res(result);
            } else {
                return err(error);
            }
        });
    });
}