import { ObjectId } from "mongodb";

// Convert Mongo's _id (ObjectId) into a plain string `id` so the client
// can use it directly in JSON.
export function out(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id?.toString?.() ?? _id, ...rest };
}

export function outMany(docs) {
  return docs.map(out);
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
