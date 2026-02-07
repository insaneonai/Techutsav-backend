'use strict';

import express from 'express';
import * as database from './database/db.js';
import * as cron from './cron/cron.js';
import {HOST} from './constants.js';
import router from './routes/routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: [`http://${HOST}:3030`] , methods: ['POST', 'GET', 'PATCH', 'DELETE'], credentials:true}));
app.use('/api',router);

app.get('/', (req, res) => {
    res.status(404).send("404 forbidden :(");
})


app.listen(8080,HOST, () => {
    console.log(`Example app listening on port 8080`)
})