import { openApiToZod } from 'zod-openapi';
import fs from 'fs';
import path from 'path';

const openapiDoc = fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf-8');
const schemas = openApiToZod(openapiDoc as any);

fs.writeFileSync(path.join(__dirname, './generated/zod-schemas.ts'), schemas);
