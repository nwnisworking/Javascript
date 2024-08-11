/**
 * Cache current store snapshot
 * 
 * @typedef {object} StoreCache
 * @property {IDBObjectStore} store
 * @property {Object.<string,IDBIndex>} index
 */

const promise = v=>new Promise((res, rej)=>{
  v.onsuccess = ()=>res(v)
  v.onerror = rej
})

export default class DB{
  /**
   * The current database version
   */
  get version(){ return this.database.version }

  /**
   * Connection to a database
   */
  get database(){ return this.#request.result }

  /**
   * Name of the connected database 
   */
  get name(){ return this.database.name }

  get transaction(){ 
    // Catch will only execute because object store does not exists
    try{
      return this.#request.transaction || this.database.transaction(this.database.objectStoreNames, 'readwrite')
    }
    catch(err){ return null }
  }

  /**
   * Current DB request as a result of opening or deleting database
   * 
   * @type {IDBOpenDBRequest} 
   */
  #request

  /** 
   * IndexedDB factory for creating databases
   * 
   * @type {IDBFactory}
   * @example
   * const bucket = await navigator.storageBuckets.open('bucket')
   * console.log(bucket.indexedDB || window.indexedDB)
   */
  #factory

  /**
   * Current store status along with its indexes
   * 
   * @type {Object.<string,StoreCache>}
   */
  #store_status = {}

  /**
   * @param {IDBOpenDBRequest} request 
   * @param {IDBFactory} factory 
   */
  constructor(request, factory){
    this.#request = request
    this.#factory = factory

    this.cacheStore()
    this.close()
  }

  /**
   * Closes the current database connection
   * 
   * @returns {DB}
   */
  close(){
    this.database.close()
    return this
  }

  /**
   * Get the store in database
   * 
   * @param {string} name 
   * @param {object} option 
   * @param {boolean} option.increment
   * @param {string} option.key
   */
  store(name, option = {}){
    const tx = this.transaction

    if(!this.status(name) && !this.is('versionchange'))
      throw new Error('Unable to retrieve store')

    if(this.is('versionchange') && !this.#store_status[name])
      this.database.createObjectStore(name, {
        keyPath : option.key,
        autoIncrement : option.increment
      })

    const store = tx.objectStore(name)

    return new DBStore(this, store)
  }

  /**
   * Get the current status of the store 
   * 
   * @param {string} name 
   * @returns {StoreCache}
   */
  status(name){
    return this.#store_status[name]
  }

  /**
   * Delete the specified store from database
   * 
   * @param {string} name 
   * @returns {DB}
   */
  deleteStore(name){
    if(this.is('versionchange'))
      this.database.deleteObjectStore(name)

    return this
  }

  /**
   * Open database and update the request 
   * 
   * @returns {Promise<DB>}
   */
  success(){
    return new Promise((res, rej)=>{
      const request = this.#factory.open(this.name)

      request.onsuccess = ()=>{
        this.#request = request
        res(this)
      }

      request.onblocked =
      request.onerror = rej
    })
  }

  /**
   * Upgrade database and update the request
   * 
   * @returns {Promise<DB>}
   */
  upgrade(){
    return new Promise((res, rej)=>{
      const request = this.#factory.open(this.name, this.version + 1)

      request.onupgradeneeded = ()=>{
        this.#request = request
        res(this)
      }

      request.onblocked =
      request.onerror = rej
    })
  }

  /**
   * Verify the current transaction mode
   * 
   * @param {'readonly'|'readwrite'|'versionchange'} type 
   */
  is(type){
    return this.transaction.mode === type
  }

  /**
   * Cache current store status for future reference
   * 
   */
  async cacheStore(){
    const tx = this.transaction

    if(!tx)
      return

    this.#store_status = {}

    for(const name of this.database.objectStoreNames){
      const store = tx.objectStore(name),
      status = this.#store_status[name] = {
        store,
        index : {}
      }

      for(const name of store.indexNames)
        status.index[name] = store.index(name)
    }
  }

  /**
   * Open a database connection 
   * 
   * @param {string} name 
   * @param {IDBFactory} db 
   * @returns {Promise<DB>}
   */
  static async open(name, db = null){
    if(!(db instanceof IDBFactory))
      db = indexedDB || window.indexedDB

    return new Promise((res, rej)=>{
      const request = db.open(name)

      request.onupgradeneeded = 
      request.onsuccess = ()=>res(new this(request, db))
      request.onerror = 
      request.onblocked = rej
    })
  }
}

class DBOption{
  /** @type {IDBIndex | IDBObjectStore} */
  #value

  constructor(value){
    this.#value = value
  }

  /**
   * Retrieves the first value that matches the query
   * 
   * @param {IDBValidKey | IDBKeyRange} query
   */
  get(query){
    return promise(this.#value.get(query)).then(e=>e.result)
  }

  /**
   * Retrieves the value that matches the query up to the total count
   * 
   * @param {IDBValidKey | IDBKeyRange | null} query 
   * @param {?number} count 
   */
  getAll(query, count){
    return promise(this.#value.getAll(query, count)).then(e=>e.result)
  }

  /**
   * Retrieve the keys that matches the query up to the total count
   * 
   * @param {IDBValidKey | IDBKeyRange | null} query 
   * @param {?number} count 
   */
  getAllKeys(){
    return promise(this.#value.getAllKeys(query, count)).then(e=>e.result)
  }

  /**
   * Retrieves the key that matches the query
   * 
   * @param {IDBValidKey | IDBKeyRange} query 
   */
  getKey(query){
    return promise(this.#value.getKey(query)).then(e=>e.result)
  }

  /**
   * Opens a cursor over the records matching query
   * 
   * @param {IDBValidKey | IDBKeyRange | null} query
   * @param {?IDBCursorDirection} dir 
   * @param {(this: IDBRequest<IDBCursorWithValue | null>, ev: Event) => any} success_cb 
   * @param {(this: IDBRequest<IDBCursorWithValue | null>, ev: Event) => any} error_cb 
   */
  openCursor(query, dir, success_cb, error_cb){
    const value = this.#value.openCursor(query, dir ?? 'next')
    value.addEventListener('error', error_cb, {once : true})
    value.addEventListener('success', e=>success_cb(e.target.result))

    return value
  }

  /**
   * Opens a cursor with key only flag set over the records matching query
   * 
   * @param {IDBValidKey | IDBKeyRange | null} query
   * @param {?IDBCursorDirection} dir 
   */
  openKeyCursor(query, dir){
    const value = this.#value.openKeyCursor(query, dir)
    value.addEventListener('error', error_cb, {once : true})
    value.addEventListener('success', e=>success_cb(e.target.result))
    return value
  }

}

class DBStore extends DBOption{
  /** @type {IDBObjectStore} */
  #store

  /** @type {DB} */
  #db

  constructor(db, store){
    super(store)
    this.#db = db
    this.#store = store
  }
  
  /**
   * Returns the index of class DBIndex
   * 
   * @param {string} name 
   * @param {string|string[]} key 
   * @param {object} option 
   * @param {boolean} option.multiple
   * @param {boolean} option.unique
   */
  index(name, key, option = {}){
    const status = this.#db.status(this.#store.name),
    index = status.index[name]

    if(this.#db.is('versionchange') && (!index || index.keyPath + '' !== key + '' || index.multiEntry !== option.multiple || index.unique !== option.unique)){
      if(index)
        this.#store.deleteIndex(name)

      this.#store.createIndex(name, key ?? name, {
        multiEntry : option.multiple,
        unique : option.unique
      })
    }

    let value = this.#store.index(name)
    
    this.#db.cacheStore()
    
    return new DBIndex(value)
  }

  /**
   * Delete store index 
   * 
   * @param {string} name 
   * @returns {DB}
   */
  deleteIndex(name){
    if(this.#db.is('versionchange')){
      this.#store.deleteIndex(name)
      this.#db.cacheStore()
    }


    return this
  }

  /**
   * Add value to store 
   * 
   * @param {any} value 
   * @param {IDBValidKey} key 
   * @returns {Promise<IDBRequest<IDBValidKey>>}
   */
  add(value, key){
    return promise(this.#store.add(value, key))
  }
  
  /**
   * Clears the current store
   * 
   * @returns {Promise<IDBRequest<undefined>>}
   */
  clear(){
    return promise(this.#store.clear())
  }

  /**
   * Counts the total length that matches the query
   * 
   * @param {IDBValidKey | IDBKeyRange} query
   * @returns {Promise<IDBRequest<number>>} 
   */
  count(query){
    return promise(this.#store.count(query))
  }

  /**
   * Delete records that matches the query
   * 
   * @param {IDBValidKey | IDBKeyRange} query 
   * @returns {Promise<IDBRequest<undefined>>}
   */
  delete(query){
    return promise(this.#store.delete(query))
  }

  /**
   * Update or add records pre-existing records
   * 
   * @param {*} value 
   * @param {IDBValidKey} query 
   * @returns {Promise<IDBRequest<IDBValidKey>>}
   */
  put(value, query){
    return promise(this.#store.put(value, query))
  }
}

class DBIndex extends DBOption{}