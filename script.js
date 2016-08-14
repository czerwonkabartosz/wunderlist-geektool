#!/usr/bin/env /usr/local/bin/node

'use strict';

const https = require( 'https' );
const fs = require( 'fs' );

const args = process.argv.slice( 2 );

const DEFAULT_HTTP_OPTIONS = {
	host: 'a.wunderlist.com',
	path: '/api/v1/lists',
	headers: {
		'X-Access-Token': args[ 0 ],
		'X-Client-ID': args[ 1 ]
	}
};

const _result = Symbol( 'result' );

class OutputBuilder {
	constructor() {
		this[ _result ] = '';
	}

	/**
	 * Adds string to output and adds new line to the end.
	 *
	 * @param {String} line
	 *
	 * @returns {OutputBuilder}
	 */
	addLine( line ) {
		this[ _result ] += line + ' \n';

		return this;
	}

	/**
	 * Adds empty line.
	 *
	 * @returns {OutputBuilder}
	 */
	addSeparator() {
		this.addLine( '' );

		return this;
	}

	/**
	 * Returns output.
	 *
	 * @returns {String}
	 */
	get result() {
		return this[ _result ];
	}
}

const TEMP_PATH = '/tmp/';

class FileCache {
	static saveValue( fileName, value ) {
		return new Promise( ( resolve, reject ) => {
			const path = TEMP_PATH + fileName;

			value = JSON.stringify( value );

			fs.writeFile( path, value, ( err ) => {
				if ( err ) {
					return reject( err );
				}

				resolve();
			} );
		} );
	}

	static getValue( fileName ) {
		return new Promise( ( resolve, reject ) => {
			fs.readFile( `${TEMP_PATH}${fileName}`, 'utf8', ( err, data ) => {
				if ( err ) {
					return reject( err );
				}

				resolve( JSON.parse( data ) );
			} );
		} );
	}
}

class WunderlistGeekTool {
	render() {
		const output = new OutputBuilder();

		console.log( `Last update: ${new Date().toUTCString()}` );
		output.addSeparator();

		this._getListsWithTasks()
			.then( ( lists ) => {
				for ( const list of lists.filter( list => list.tasks.length ) ) {
					output.addLine( `${list.title} ( ${list.tasks.length} )` );

					for ( const task of list.tasks ) {
						let daysToTask = this._getDaysToTask( task );

						output.addLine( `     ${task.starred ? '*' : ' '}${this._isAfterDeadline( task ) ? '!' : ' ' }    ${task.title}    ${task.due_date ||
						''}${daysToTask !== null ? ` ( ${daysToTask} )` : ''}` );
					}
				}

				console.log( output.result );

				FileCache.saveValue( 'output', {
					result: output.result,
					date: new Date()
				} );
			} )
			.catch( ( err ) => {
				if ( err[ 'invalid_request' ] ) {
					output.addLine( 'Invalid Request. It is possible that lack of data - Access Token or Client Id' ).addSeparator();
				}

				FileCache.getValue( 'output' )
					.then( ( data ) => {
						if ( data ) {
							output.addLine( data.result )
								.addSeparator()
								.addLine( `Information from cache ( ${new Date( data.date ).toUTCString()} )` );

							console.log( output.result );
						}
					} );
			} );
	}

	/**
	 * Returns information about the number of days to task.
	 *
	 * @private
	 * @param {Task} task
	 * @returns {Number}
	 */
	_getDaysToTask( task ) {
		if ( !task.due_date ) {
			return null;
		}

		const dueDate = new Date( task.due_date );
		dueDate.setHours( 0, 0, 0, 0 );

		return Math.round( (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) );
	}

	/**
	 * Returns information whether a task is after the deadline.
	 *
	 * @private
	 * @param {Task} task
	 * @returns {Boolean}
	 */
	_isAfterDeadline( task ) {
		const dayToTask = this._getDaysToTask( task );

		return dayToTask !== null && dayToTask <= 0;
	}

	/**
	 * Returns lists.
	 *
	 * @private
	 * @returns {Promise.<Array.<List>>}
	 */
	_getLists() {
		return HttpHelper.get( '/api/v1/lists' )
			.then( ( lists ) => {
				return this._getListsOrder()
					.then( ( ids ) => {
						const results = [];

						for ( const id of ids ) {
							const list = lists.find( list => list.id === id );

							if ( list ) {
								results.push( list );
							}
						}

						return results;
					} );
			} );
	}

	/**
	 * Returns lists with included tasks.
	 *
	 * @private
	 * @returns {Promise.<Array.<List>>}
	 */
	_getListsWithTasks() {
		return this._getLists().then( ( lists ) => {
			const getAllTasks = [];

			for ( const list of lists ) {
				getAllTasks.push( new Promise( ( resolve ) => {
					this._getTasksForList( list.id )
						.then( ( tasks ) => {
							list.tasks = tasks;
							resolve();
						} );
				} ) );
			}

			return Promise.all( getAllTasks )
				.then( () => lists );
		} );
	}

	/**
	 * Returns lists order.
	 *
	 * @private
	 * @returns {Promise.<Array.<Number>>}
	 */
	_getListsOrder() {
		return HttpHelper.get( '/api/v1/list_positions' )
			.then( ( res ) => res[ 0 ].values );
	}

	/**
	 * Return tasks for list.
	 *
	 * @private
	 * @param {Number} listId
	 * @returns {Promise.<Array.<Task>>}
	 */
	_getTasksForList( listId ) {
		return HttpHelper.get( `/api/v1/tasks?list_id=${listId}` )
			.then( ( tasks ) => {
				const results = [];

				return this._getTasksOrder( listId )
					.then( ( ids ) => {
						for ( const id of ids ) {
							const task = tasks.find( task => task.id === id );

							if ( task ) {
								results.push( task );
							}
						}

						return results;
					} );
			} );
	}

	/**
	 * Returns tasks order.
	 *
	 * @private
	 * @param {Number} listId
	 * @returns {Promise.<Array.<Number>>}
	 */
	_getTasksOrder( listId ) {
		return HttpHelper.get( `/api/v1/task_positions?list_id=${listId}` )
			.then( ( res ) => res[ 0 ].values );
	}
}

class HttpHelper {
	/**
	 * Sends request to Wunderlist API.
	 *
	 * @param {String} path
	 * @returns {Promise.<*>}
	 */
	static get( path ) {
		return new Promise( ( resolve, reject )=> {
			const options = Object.assign( {}, DEFAULT_HTTP_OPTIONS );
			options.path = path;

			https.get( options, ( res ) => {
				let body = '';

				res.on( 'data', ( chunk ) => {
					body += chunk;
				} );

				res.on( 'end', () => {
					const response = JSON.parse( body );

					if ( response[ 'invalid_request' ] ) {
						return reject( response );
					}

					resolve( response );
				} );

				res.on( 'error', ( err ) => reject( err ) );

				res.on( 'timeout', () => reject() );
			} );
		} );
	}
}

new WunderlistGeekTool().render();

/**
 * @typedef {Object} List
 * @property {Number} id
 * @property {Date} created_at
 * @property {String} title
 */

/**
 * @typedef {Object} ListWithTasks
 * @property {Number} id
 * @property {Date} created_at
 * @property {String} title
 * @property {Array.<Task>} tasks
 */

/**
 * @typedef {Object} Task
 * @property {Number} id
 * @property {Date} created_at
 * @property {Date} due_date
 * @property {String} title
 * @property {Boolean} starred
 */
