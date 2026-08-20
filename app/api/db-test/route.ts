import { prisma } from "../../../lib/db";

export async function GET(request: Request) {
  try {
    // Example: fetch all records from a table
    // const users = await prisma.user.findMany();

    return Response.json({
      message: "Database connected successfully",
      // data: users,
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json(
      {
        error: "Failed to connect to database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
