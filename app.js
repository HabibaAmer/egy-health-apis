// read from env file
require('dotenv').config();

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const network = require('./fabric/network');
const router = require('./routes/index')

async function main() {
	network.loadAdmin(true, false);
	network.loadAdmin(false, true);
	network.enrollAdmin(true, false);
	network.enrollAdmin(false, true);

	const app = express();
	app.use(morgan('combined'));
	app.use(bodyParser.json());
	app.use(cors());

	app.use('/', router);

	app.listen(process.env.PORT, () => {
		console.log(`App listening on port ${process.env.PORT}`)
	});
}

main();
