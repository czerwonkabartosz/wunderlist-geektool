const https = require( 'https' );

const args = process.argv.slice( 2 );

const DEFAULT_HTTP_OPTIONS = {
	host: 'a.wunderlist.com',
	path: '/api/v1/lists',
	headers: {
		'X-Access-Token': args[ 0 ],
		'X-Client-ID': args[ 1 ]
	}
};

class WunderlistGeekTool {
	render() {
		console.log( `Last update: ${new Date()}` );

		this._getListsWithTasks()
			.then( ( lists ) => {
				for ( const list of lists.filter( list => list.tasks.length ) ) {
					console.log( `${list.title} ( ${list.tasks.length} )` );

					for ( const task of list.tasks ) {
						const dayToTask = this._getDaysToTask( task );

						console.log( `     ${task.starred ? '*' : ' '}${this._isAfterDeadline( task ) ? '!' : ' ' }    ${task.title}    ${task.due_date ||
						''}${dayToTask !== null ? ` ( ${dayToTask} )` : ''}` );
					}
				}
			} )
			.catch( ( err ) => {
				if ( err[ 'invalid_request' ] ) {
					console.log( 'Invalid Request. It is possible that lack of data - Access Token or Client Id' );
				}
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
