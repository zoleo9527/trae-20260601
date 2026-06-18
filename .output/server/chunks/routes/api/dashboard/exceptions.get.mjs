import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { m as mockExceptionRecords } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const exceptions_get = defineEventHandler(async (event) => {
  return {
    code: 200,
    message: "success",
    data: mockExceptionRecords
  };
});

export { exceptions_get as default };
//# sourceMappingURL=exceptions.get.mjs.map
