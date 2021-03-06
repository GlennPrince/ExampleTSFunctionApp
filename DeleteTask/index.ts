import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as AzureStorage from "azure-storage"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Delete Task Triggered');

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
    
    await apiFunctionWrapper(tableSvc, tableName, task).then(value => {
        context.res.status(204).json({ taskId: req.body.taskID });
    }, error => {
        context.res.status(error["statusCode"]).json({ taskId: req.body.taskID, error: error["body"] });
    });
};

export default httpTrigger;

function apiFunctionWrapper(tableSvc, tableName, task) {
    return new Promise((res, err) => {
        tableSvc.deleteEntity(tableName, task, function (error, result) {
            if (!error) {
                return res(result);
            } else {
                return err(error);
            }
        });
    });
}