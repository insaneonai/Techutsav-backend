'use strict';

import mongoose from 'mongoose';
import { DB_URL } from '../constants.js';

mongoose.connect(DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
console.info('connected to db');