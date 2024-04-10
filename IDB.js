/**
 * status
 * 0 - normal
 * 1 - new 
 * 2 - delete
 * 3 - delete then new
 */

function promise(d, e){
  return new Promise((res, rej)=>{
    e.close()
    d.onsuccess = ()=>res(d.result)
    d.onerror = e=>rej(e)
  })
}


/**
 * @typedef {IndexInterface}
 * @property {string} IndexInterface.name
 * @property {string} IndexInterface.key
 * @property {boolean} IndexInterface.increment
 * @property {number} IndexInterface.status
 */

export class IDBStore{
  /** @type {string} */
  name
  
  /** @type {string} */
  key
  
  /** @type {boolean} */
  increment

  /** @type {number} */
  status = 1

  /** @type {IDBObjectStore} */
  #os

  /** @type {IDB} */
  #db

  #index = {}

  /**
   * 
   * @param {IDB} db 
   * @param {IDBObjectStore} os 
   */
  constructor(db, os){
    this.#db = db
    this.#os = os
    this.name = os.name
    this.key = os.keyPath
    this.increment = os.autoIncrement

    if(!(os instanceof IDBObjectStore)) return this

    this.status = 0

    for(let index of os.indexNames){
      const { name, keyPath, multiEntry, unique } = os.index(index)
      this.#index[name] = { name, keyPath, unique, multiEntry, status : 0 }
    }
  }

  createIndex(name, keyPath, {unique = false, multiEntry = false} = {}){
    const status = this.#index[name] ? 3 : 1
    this.#index[name] = { name, keyPath, unique, multiEntry, status}

    return this
  }

  deleteIndex(name){
    if(this.#index[name])
      this.#index[name].status = 2
    return this
  }

  deleteStore(){
    this.status = 2
    return this
  }

  update(){
    const data = []

    for(let x in this.#index){
      const index = this.#index[x]

      if(index.status === 0) 
        continue
      else if(index.status === 3) 
        data.push(
          this.#_index({...index, status : 2}), 
          this.#_index({...index, status : 1})
        )
      else 
        data.push(this.#_index(index))
    }

    return data
  }

  async get(key, index = null){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readonly')
    const store = tx.objectStore(this.name)
    let get

    if(index)
      get = store.index(index).get(key)
    else
      get = store.get(key)

    return promise(get, db.result)
  }

  async getAll(key, index = null){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readonly')
    const store = tx.objectStore(this.name)
    let get

    if(index)
      get = store.index(index).getAll(key)
    else
      get = store.getAll(key)

    return promise(get, db.result)
  }

  async getAllKeys(key, count = null, index = null){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readonly')
    const store = tx.objectStore(this.name)
    let get

    if(index)
      get = store.index(index).getAllKeys(key, count)
    else
      get = store.getAllKeys(key, count)

    return promise(get, db.result)
  }

  async getKey(key, index = null){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readonly')
    const store = tx.objectStore(this.name)
    let get

    if(index)
      get = store.index(index).getKey(key)
    else
      get = store.getKey(key)

    return promise(get, db.result)
  }

  async add(data, key = undefined){
    if(this.key && !data[this.key]){
      throw new Error('store requires key inside data')
    }
    else if(!this.key && !key){
      throw new Error('store requires key')
    }

    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readwrite')
    const store = tx.objectStore(this.name)
    
    return promise(store.add(data, key), db.result)
  }

  async put(data, key = undefined){
    if(this.key && !data[this.key]){
      throw new Error('store requires key inside data')
    }
    else if(!this.key && !key){
      throw new Error('store requires key')
    }

    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readwrite')
    const store = tx.objectStore(this.name)
    
    return promise(store.put(data, key), db.result)
  }

  async delete(data, key = undefined){
    if(this.key && !data[this.key]){
      throw new Error('store requires key inside data')
    }
    else if(!this.key && !key){
      throw new Error('store requires key')
    }

    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readwrite')
    const store = tx.objectStore(this.name)
    
    return promise(store.delete(data, key), db.result)
  }

  async cursor(key = null, dir = 'next'){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readwrite')
    const store = tx.objectStore(this.name)
    
    return store.openCursor(key, dir)
  }

  async cursorKey(key = null, dir = 'next'){
    const db = await this.#db.open()
    const tx = db.result.transaction(this.name, 'readwrite')
    const store = tx.objectStore(this.name)
    
    return store.openKeyCursor(key, dir)
  }

  has(...index){
    return !Object.keys(this.#index).filter(x=>!index.includes(x)).length
  }

  #_index(index){
    return {
      name : index.status === 1 ? 'createIndex' : 'deleteIndex',
      arg : index.status === 1 ? [
        index.name, 
        index.keyPath, 
        {unique : index.unique, multiEntry : index.multiEntry}
      ] : [index.name]
    }
  }
}

export default class IDB{
  /** @type {string} */
  name

  /** @type {number} */
  version = 0

  stores = {}

  /**
   * 
   * @param {string} name 
   * @param {number} version 
   * @param {IDBOpenDBRequest} db 
   */
  constructor(name, version, db){
    this.name = name
    this.version = version

    if(!db) return this

    for(let i of db.result.objectStoreNames)
      this.stores[i] = new IDBStore(this, db.result.transaction(i, 'readonly').objectStore(i))
  }

  /**
   * @param {?number} version 
   * @returns {Promise<IDBOpenDBRequest>}
   */
  open(version){
    return new Promise((res, rej)=>{
      const db = indexedDB.open(this.name, Number.isNaN(version) ? 1 : version)
      db.onsuccess = db.onupgradeneeded = ()=>res(db)
      db.onblocked = db.onerror = rej
    })
  }

  async upgrade(){
    const db = await this.open(++this.version)

    for(let [name, _] of Object.entries(this.stores)){
      let store

      if(!_.status)
        store = db.transaction.objectStore(name)
      else
        store = db.result.createObjectStore(name, {autoIncrement : _.increment, keyPath : _.key})
      
      for(let x of _.update()){
        store[x.name](...x.arg)
      }

      this.stores[name] = new IDBStore(this, store)
    }

    db.result.close()

    return this
  }

  /**
   * @param {string} name 
   * @param {string} key 
   * @param {boolean} increment 
   * @returns {IDBStore}
   */
  createStore(name, key, increment = false){
    if(this.stores[name])
      return this.stores[name]
    return this.stores[name] = new IDBStore(this, {name, keyPath : key, autoIncrement : increment})
  }

  static get(name){
    return new Promise(async res=>{
      let m
      if(!(m = await this.exists(name)))
        return res(new this(name))
      
      indexedDB.open(name).onsuccess = e=>(res(new this(...Object.values(m), e.target)), e.target.result.close())
    })
  }

  static async exists(name){
    return (await indexedDB.databases()).find(e=>e.name === name)
  }
}
