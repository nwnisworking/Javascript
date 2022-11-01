import IDB from "./IDB.js"

export default class IDBResult{
	name
	/**@type {IDBObjectStore} */
	store
	/**@type {IDB} */
	db

	constructor(name, db){
		const {result} = db.conn
		this.db = db
		this.name = name
		this.store = result.transaction(name, 'readwrite').objectStore(name)
	}

	async get(value){
		return this.#store_promise('get', value)
	}

	async put(value, key){
		return this.#store_promise('put', value, key)
	}

	async add(value, key){
		return this.#store_promise('add', value, key)
	}

	async delete(key){
		return this.#store_promise('delete', key)
	}

	#store_promise(type, value, key){
		return new Promise(res=>{
			try{
				const store = this.store[type](value, key)
				store.onsuccess = e=>res(e.target.result)
			}
			catch(e){
				this.db.open().then(()=>res(this[type](value, key)))
			}
		})
	}

	reset(){
		const {result} = this.db.conn
		this.store = result.transaction(this.name, 'readwrite').objectStore(this.name)
	}
}