declare module "@prisma/client/runtime/library" {
  // override Prisma’s recursive JSON types so tsoa stops expanding them
  export type JsonValue = any;
  export type JsonArray = any[];
  export type JsonObject = Record<string, any>;
}
