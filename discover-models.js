'use strict';

const loopback = require('loopback');
const promisify = require('util').promisify;
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdirp = promisify(require('mkdirp'));

const DATASOURCE_NAME = 'mysqldb';
const dataSourceConfig = require('./server/datasources.json');
const DATABASE_NAME = dataSourceConfig[DATASOURCE_NAME]['database'];
const db = new loopback.DataSource(dataSourceConfig[DATASOURCE_NAME]);

const tableList = [
	{ tableName:'t_catalog', path:'catalog' },
	{ tableName:'t_goods', path:'goods' },
	{ tableName:'t_goods_catalog', path:'goods_catalog' },
	{ tableName:'t_goods_sub', path:'goods_sub' },
	{ tableName:'t_order', path:'order' },
	{ tableName:'t_order_flow', path:'order_flow' },
	{ tableName:'t_order_review', path:'order_review' },
	{ tableName:'t_shop', path:'shop' },
	{ tableName:'t_shop_promotion', path:'shop_promotion' },
	{ tableName:'t_coupon', path:'coupon' },
	{ tableName:'t_user_address', path:'user_address' },
	{ tableName:'t_user_coupon', path:'user_coupon' },
	{ tableName:'t_user_info', path:'user_info' }
];

discover().then(
  success => process.exit(),
  error => { console.error('UNHANDLED ERROR:\n', error); process.exit(1); },
);

async function discover() {
	// Create model direactor
  await mkdirp('common/models');

	// Read model config file
  const configJson = await readFile('server/model-config.json', 'utf-8');
	const config = JSON.parse(configJson);

	// Expose models via REST API
	for(let tableItem of tableList){
		await createModel(tableItem);
		config[tableItem.path] = {dataSource: DATASOURCE_NAME, public: true};
	}
  await writeFile(
    'server/model-config.json',
    JSON.stringify(config, null, 2)
  );
	console.log('MODEL CONFIG IS OK');
}

async function createModel(tableItem) {
	// It's important to pass the same "options" object to all calls
  // of dataSource.discoverSchemas(), it allows the method to cache
  // discovered related models
  const options = {relations: true};
	
	const { tableName,path } = tableItem;

  // Discover models and relations
  const tableSchemas = await db.discoverSchemas(tableName, options);
	const table = tableSchemas[DATABASE_NAME+'.'+tableName];
	table.name = path;
	table.plural = path;

  // Create model definition files
  await mkdirp('common/models');
  await writeFile(
		'common/models/'+path+'.json',
		JSON.stringify(table, null, 2)
  );
}