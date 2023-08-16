const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
module.exports = app;
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializerDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializerDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    todoId: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusQuery = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//Returns a list of all todos whose status is 'TO DO'

//Returns a list of all todos whose priority is 'HIGH'

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo where todo like 
          '%${search_q}%' and status = '${status}' and priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo where 
      todo like '%${search_q}%' and priority = '${priority}';`;
      break;
    case hasStatusQuery(request.query):
      getTodoQuery = `select * from todo where 
      todo like '%${search_q}%' and status = '${status}';`;
      break;
    default:
      getTodoQuery = `select * from todo where 
      todo like '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const specificTodoQuery = `select * from todo where id = ${todoId};`;
  dbResponse = await db.get(specificTodoQuery);
  response.send(dbResponse);
});

//Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const createTodo = request.body;
  const { id, todo, priority, status } = createTodo;
  createTodoQuery = `insert into todo (id, todo, priority, status) 
  values (${id}, '${todo}', '${priority}', '${status}')`;
  todoCreated = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const todoUpdate = request.body;
  switch (true) {
    case todoUpdate.status !== undefined:
      updateColumn = "Status";
      break;
    case todoUpdate.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoUpdate.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `select * from todo 
  where id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const statusUpdateQuery = `update todo set todo = '${todo}',
  priority = '${priority}',
  status = '${status}' 
    where id = ${todoId};`;
  await db.run(statusUpdateQuery);
  response.send(`${updateColumn} Updated`);
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
