import express from 'express';
import bodyParser from 'body-parser';
import { initDB } from './database';
import { createPrd, deletePrd, getPrdById, getPrds, updatePrd } from './handlers';

const app = express();
const port = 8080;

app.use(bodyParser.json());

initDB('prds.db').then(db => {
  app.get('/prds', getPrds(db));
  app.post('/prds', createPrd(db));
  app.get('/prds/:id', getPrdById(db));
  app.put('/prds/:id', updatePrd(db));
  app.delete('/prds/:id', deletePrd(db));

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
