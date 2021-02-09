export enum HTTP {
  OK = 200,
  Created = 201,

  Moved = 301,
  NotModified = 304,

  BadRequest = 400,
  Unauthorised = 401,
  Forbidden = 403,
  DataInvalid = 422,
  NotFound = 404,
  RateLimit = 429,
  Conflict = 409,

  ServerError = 500,
}
