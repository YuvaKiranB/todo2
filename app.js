const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const startDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

startDB();

const getCamelCase = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

const hasPriorityStatusCategory = (priority, status, category) => {
  return priority !== "" && status !== "" && category !== "";
};

const hasPriorityStatus = (priority, status, category) => {
  return priority !== "" && status !== "";
};

const hasStatusCategory = (priority, status, category) => {
  return status !== "" && category !== "";
};

const hasPriorityCategory = (priority, status, category) => {
  return priority !== "" && status !== "";
};

const hasPriority = (priority, status, category) => {
  return priority !== "";
};

const hasStatus = (priority, status, category) => {
  return status !== "";
};

const hasCategory = (priority, status, category) => {
  return category !== "";
};

let validateResponse = {};

const validate1 = (priority, status, category) => {
  if (
    priority === "" ||
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW"
  ) {
    if (
      status === "" ||
      status === "TO DO" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    ) {
      if (
        category === "" ||
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        return true;
      } else {
        validateResponse.message = "Invalid Todo Category";
        return false;
      }
    } else {
      validateResponse.message = "Invalid Todo Status";
      return false;
    }
  } else {
    validateResponse.message = "Invalid Todo Priority";
    return false;
  }
};

const validateDate = (date) => {
  return isMatch(date, "yyyy-MM-dd");
};

const formatDate = (date) => {
  const dateArray = date.split("-");
  return format(
    new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
    "yyyy-MM-dd"
  );
};

app.get("/todos/", async (request, response) => {
  const {
    priority = "",
    status = "",
    category = "",
    search_q = "",
  } = request.query;
  let getTodos = "";

  if (validate1(priority, status, category)) {
    switch (true) {
      case hasPriorityStatusCategory(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     priority = "${priority}" AND
     status = "${status}" AND
     category = "${category}";`;
        break;

      case hasPriorityStatus(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     priority = "${priority}" AND
     status = "${status}";`;
        break;

      case hasStatusCategory(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     status = "${status}" AND
     category = "${category}";`;
        break;

      case hasPriorityCategory(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     priority = "${priority}" AND
     category = "${category}";`;
        break;

      case hasPriority(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     priority = "${priority}";`;
        break;

      case hasStatus(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     status = "${status}";`;
        break;

      case hasCategory(priority, status, category):
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%" AND
     category = "${category}";`;
        break;

      default:
        getTodos = `
     SELECT *
     FROM todo
     WHERE
     todo LIKE "%${search_q}%";`;
    }

    const todos = await db.all(getTodos);
    response.send(
      todos.map((todo) => {
        return getCamelCase(todo);
      })
    );
  } else {
    response.status(400);
    response.send(validateResponse.message);
  }
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
  SELECT *
  FROM todo
  WHERE id = ${todoId}`;

  const todo = await db.get(getTodo);
  response.send(getCamelCase(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (validateDate(date)) {
    const resDate = formatDate(date);
    const getTodos = `
    SELECT *
    FROM todo
    WHERE due_date = "${resDate}";`;
    const todos = await db.all(getTodos);
    response.send(
      todos.map((todo) => {
        return getCamelCase(todo);
      })
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (validate1(priority, status, category) && validateDate(dueDate)) {
    let due_date = formatDate(dueDate);
    const writeTodo = `
  INSERT INTO todo (id, todo, priority, status, category, due_date)
  VALUES (${id}, "${todo}", "${priority}", "${status}", "${category}", "${due_date}");`;
    await db.run(writeTodo);
    response.send("Todo Successfully Added");
  } else {
    if (validate1(priority, status, category) !== true) {
      response.status(400);
      response.send(validateResponse.message);
    } else if (validateDate(dueDate) !== true) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.put("/todos/:todoId", async (request, response) => {
  const {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = request.body;
  const { todoId } = request.params;
  let upDateTodo;

  if (validate1(priority, status, category)) {
    if (status !== "") {
      upDateTodo = `
    UPDATE todo
    SET
    status = "${status}"
    WHERE id = ${todoId};`;
      await db.run(upDateTodo);
      response.send("Status Updated");
    } else if (priority !== "") {
      upDateTodo = `
    UPDATE todo
    SET
    priority = "${priority}"
    WHERE id = ${todoId};`;
      await db.run(upDateTodo);
      response.send("Priority Updated");
    } else if (todo !== "") {
      upDateTodo = `
    UPDATE todo
    SET
    todo = "${todo}"
    WHERE id = ${todoId};`;
      await db.run(upDateTodo);
      response.send("Todo Updated");
    } else if (category !== "") {
      upDateTodo = `
    UPDATE todo
    SET
    category = "${category}"
    WHERE id = ${todoId};`;
      await db.run(upDateTodo);
      response.send("Category Updated");
    } else if (dueDate !== "") {
      if (validateDate(dueDate)) {
        let due_date = formatDate(dueDate);
        upDateTodo = `
    UPDATE todo
    SET
    due_date = "${due_date}"
    WHERE id = ${todoId};`;
        await db.run(upDateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    }
  } else {
    response.status(400);
    response.send(validateResponse.message);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
  DELETE FROM todo
  WHERE id = ${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
