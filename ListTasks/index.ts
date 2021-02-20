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
    
    try{
        var response = await apiFunctionWrapper(tableSvc, tableName, query);

        var formattedEntries = new Array();
        for (var i = 0; i < response["entries"].length; i++) {
            formattedEntries.push({
                username: response["entries"][i]["PartitionKey"]._,
                taskID: response["entries"][i]["RowKey"]._,
                name: response["entries"][i]["name"]._,
                dueDate: response["entries"][i]["dueDate"]._,
                completed: response["entries"][i]["completed"]._
            });
        }

        context.res.status(200).json({
            "results": formattedEntries
        });
    } catch(err){
        context.log(err);
        context.res.status(500).json({ taskId: req.body.taskID, error: "TaskID does not exist for user" });
    }
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