import { Assignment } from "./assignmentExtractor";

const MONDAY_API = "https://api.monday.com/v2";

/**
 * End-to-end helper:
 *  – creates a board for the course (board_kind: private)
 *  – adds date, numbers & status columns
 *  – pushes each assignment as an item
 */
export async function createBoardAndPushAssignments(
  courseName: string,
  assignments: Assignment[],
  apiKey?: string
) {
  // Prefer the provided apiKey (e.g. retrieved via OAuth). Fallback to
  // the MONDAY_API_KEY env variable for local development.
  const effectiveApiKey = apiKey ?? process.env.MONDAY_API_KEY;

  if (!effectiveApiKey) {
    throw new Error("Missing Monday.com access token");
  }

  // 1️⃣  Create the board
  const boardId = await createBoard(courseName, effectiveApiKey);

  // 2️⃣  Add the columns we need and capture their IDs
  const columns = await createColumns(boardId, effectiveApiKey);

  // 3️⃣  Insert the assignments
  await Promise.all(
    assignments.map((a) => createItem(boardId, columns, a, effectiveApiKey))
  );

  return boardId; // optional – handy if you want to redirect the user
}

/* ---------------- Core helpers ---------------- */

async function createBoard(courseName: string, apiKey: string): Promise<number> {
  const query = `
    mutation ($name: String!) {
      create_board (board_name: $name, board_kind: private) { id }
    }`;
  const res = await graphQL(query, { name: courseName }, apiKey);
  return res.data.create_board.id;
}

type ColumnInfo = { title: string; type: string; id: string };

/**
 * Creates three columns and returns a lookup object:
 * { date: "dateColId", points: "numbersColId", category: "statusColId" }
 */
async function createColumns(
  boardId: number,
  apiKey: string
): Promise<Record<"date" | "points" | "category", string>> {
  // We compose one mutation that creates three columns. For the status column
  // we pre-define the labels so we can later refer to them by name (e.g.
  // "Homework", "Quiz", ...).
  const statusLabels = {
    0: "Homework",
    1: "Quiz",
    2: "Exam",
    3: "Project",
  } as const;

  const mutation = `mutation {
    dateCol: create_column(
      board_id: ${boardId},
      title: "Due Date",
      column_type: date
    ) { id }

    pointsCol: create_column(
      board_id: ${boardId},
      title: "Points",
      column_type: numbers
    ) { id }

    categoryCol: create_column(
      board_id: ${boardId},
      title: "Category",
      column_type: text
    ) { id }
  }`;

  const res = await graphQL(mutation, {}, apiKey);

  // Map the returned ids back to friendly keys
  return {
    date: res.data.dateCol.id,
    points: res.data.pointsCol.id,
    category: res.data.categoryCol.id,
  };
}

async function createItem(
  boardId: number,
  cols: Record<"date" | "points" | "category", string>,
  a: Assignment,
  apiKey: string
) {
  const columnValues: Record<string, unknown> = {
    [cols.date]: a.dueDate ? { date: a.dueDate } : undefined,
    [cols.points]: typeof a.points === "number" ? a.points : undefined,
    [cols.category]: a.category ?? undefined,
  };

  const query = `
    mutation ($name: String!, $values: JSON!) {
      create_item(
        board_id: ${boardId},
        item_name: $name,
        column_values: $values
      ) { id }
    }`;

  await graphQL(
    query,
    { name: a.title, values: JSON.stringify(columnValues) },
    apiKey
  );
}

/* -------- Tiny fetch wrapper -------- */

async function graphQL(
  query: string,
  variables: Record<string, unknown>,
  apiKey: string
) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json;
}
