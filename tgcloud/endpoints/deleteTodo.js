import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { todos } from '../schema.js';
import { getUserId } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const todoId = Number(input?.id);
  if (!todoId) {
    throw new EndpointError('Task ID is required', { code: 'INVALID_ID' });
  }

  const existing = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)))
    .get();

  if (!existing) {
    throw new EndpointError('Task not found', { code: 'NOT_FOUND' });
  }

  await db.delete(todos).where(eq(todos.id, todoId)).run();

  return {
    ok: true,
    deletedId: todoId,
  };
}
