import { PassThrough } from "node:stream";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import * as isbotModule from "isbot";
import { createRequestHandler } from "@remix-run/node";

const BUILD_DIR = join(process.cwd(), "build");

const handleRequest = createRequestHandler({
  build: require(BUILD_DIR),
  mode: process.env.NODE_ENV,
});

export default async function (request) {
  const isbot = await isbotModule.default(request.headers.get("user-agent"));
  
  if (isbot) {
    return handleRequest(request);
  }

  const response = await handleRequest(request);
  
  if (response.headers.get("Content-Type")?.startsWith("text/html")) {
    const { readable, writable } = new PassThrough();
    response.body.pipe(writable);
    return new Response(readable, response);
  }

  return response;
}
