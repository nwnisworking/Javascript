import IDBResult from "./IDBResult.js"

export default class IDB{
	/**@type {string} */
	name

	/**@type {Map<string, IDBResult>} */
	stores = new Map
	
	/**@type {IDBOpenDBRequest} */
	conn

	/**@type {number} */
	version

	constructor(name){
		this.name = name

		return this.open()
	}

	/**
	 * Close connection to the database
	 */
	close(){
		this.conn.result.close()
	}

	/**
	 * Opens the connection and set the store 
	 * @returns {Promise<IDB,Event>}
	 */
	open(){
		this.conn = indexedDB.open(this.name)
		return new Promise((res, rej)=>{
			this.conn.onblocked = 
			this.conn.onerror = rej

			this.conn.onsuccess = ()=>{
				const {result} = this.conn
				this.version = result.version;
				
				[...result.objectStoreNames].forEach(e=>{
					if(!this.stores.has(e))
						this.stores.set(e, new IDBResult(e, this))
					else
						this.stores.get(e).reset()
				})

				res(this)
				result.close()
			}
		})
	}

	/**
	 * Create store along with its index
	 * @param {string} name 
	 * @param {string} keyPath 
	 * @param {boolean} autoIncrement 
	 * @returns {Object}
	 */
	create(name, keyPath = null, autoIncrement = false){
		const indexes = []

		return {
			index(name, {key, multi = false, unique = false} = {}){
				indexes.push({name, key, options : {unique, multiEntry : multi}})
				return this
			},
			build : ()=>{
				this.conn = indexedDB.open(this.name, ++this.version)

				this.conn.onupgradeneeded = ()=>{
					const {result} = this.conn
					const obj = result.createObjectStore(name, {autoIncrement, keyPath})
					indexes.forEach(({unique, multiEntry})=>obj.createIndex(name, keyPath ?? name, {unique, multiEntry}))
					result.close()
				}
			}
		}
	}

	/**
	 * Delete store from the database
	 * @param {string} name 
	 */
	delete(name){
		this.conn = indexedDB.open(this.name, ++this.version)

		this.conn.onupgradeneeded = ()=>{
			const {result} = this.conn
			result.deleteObjectStore(name)
			result.close()			
		}
	}
}