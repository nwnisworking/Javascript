const { subtle } = crypto

export const ENC_DEC = 1 << 0

export const SIGN_VERIFY = 1 << 1

export const WRAP_UNWRAP = 1 << 2

export const DERIVE = 1 << 3

export const AES_GCM_IV = 12

export const AES_CTR_IV = 16

export const AES_CBC_IV = 16

/**
 * 
 * @param {string} str 
 * @returns {Uint8Array}
 */
function toBuffer(str){
  const u = new Uint8Array(str.length)

  for(let i = 0; i < str.length; i++)
    u[i] = str.charCodeAt(i)

  return u
}

function convert(value){
  if((typeof value === 'object' && (!Array.isArray(value)) && !(value instanceof ArrayBuffer)) || ArrayBuffer.isView(value))
    return value
  else if(typeof value === 'string')
    return toBuffer(value)
  else if(value instanceof ArrayBuffer)
    return new Uint8Array(value)
  else
    throw new TypeError('Invalid type provided')
}

/**
 * 
 * @param {number} value 
 * @returns {KeyUsage[]}
 */
function getUsages(value){
  const usages = []

  if(value & ENC_DEC)
    usages.push('encrypt', 'decrypt')

  if(value & SIGN_VERIFY)
    usages.push('sign', 'verify')

  if(value & WRAP_UNWRAP)
    usages.push('wrapKey', 'unwrapKey')

  if(value & DERIVE)
    usages.push('deriveBits', 'deriveKey')

  return usages
}

/**
 * 
 * @param {number} length 
 * @returns {Uint8Array}
 */
export function random(length){
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * 
 * @param {1|256|384|512} type 
 * @param {string|Uint8Array} value 
 */
export function digest(type, value){
  return subtle.digest(`SHA-${type}`, convert(value))
}

/**
 * 
 * @param {KeyFormat} format 
 * @param {CryptoKey} key 
 */
export function exportKey(format, key){
  if((!key.algorithm.name.match(/(AES|EC|HMAC)/g) && format === 'raw')){
    if(key.type === 'public')
      format = 'spki'
    else
      format = 'pkcs8'
  }

  return subtle.exportKey(format, key).then(convert)
}

/**
 * 
 * @param {KeyFormat} format 
 * @param {JsonWebKey|Uint8Array|string} data 
 * @param {AlgorithmIdentifier|RsaHashedImportParams|EcKeyImportParams|HmacImportParams|AesKeyAlgorithm} alg 
 * @param {number} usages 
 * @returns {CryptoKey}
 */
export function importKey(format, data, alg, usages){
  return subtle.importKey(format, convert(data), alg, true, getUsages(usages))
}

/**
 * 
 * @param {CryptoKey} public_key 
 * @param {CryptoKey} private_key 
 * @param {AlgorithmIdentifier | AesDerivedKeyParams | HmacImportParams | HkdfParams | Pbkdf2Params} derive 
 * @param {number} usages 
 */
export function deriveKey(public_key, private_key, derive, usages){
  return subtle.deriveKey({name : private_key.algorithm.name, public : public_key}, private_key, derive, true, getUsages(usages))
}

/**
 * 
 * @param {CryptoKey} key 
 * @param {BufferSource} data 
 * @param {object} option 
 */
export async function encrypt(key, data, option = {}){
  const { name } = key.algorithm
  let v

  switch(name){
    case 'AES-GCM' : 
    v = option.iv??= random(12)
    break
    case 'AES-CBC' : 
    v = option.iv??= random(16)
    break
    case 'AES-CTR' : 
    v = option.counter??= random(16)
    break
  }

  const enc = await subtle.encrypt({name, ...option}, key, convert(data)).then(convert),
  u = new Uint8Array(v.length + enc.length)
  u.set(v)
  u.set(enc, v.length)

  return u
}

/**
 * 
 * @param {CryptoKey} key 
 * @param {Uint8Array|string} data 
 * @param {*} option 
 * @returns 
 */
export async function decrypt(key, data, option = {}){
  const { name } = key.algorithm

  data = convert(data)

  switch(name){
    case 'AES-GCM' : 
    option.iv??= data.slice(0, 12)
    data = data.slice(12)
    break
    case 'AES-CBC' : 
    option.iv??= data.slice(0, 16)
    data = data.slice(16)
    break
    case 'AES-CTR' : 
    option.counter??= data.slice(0, 16)
    data = data.slice(16)
    break
  }

  return await subtle.decrypt({name, ...option}, key, data).then(convert)
}

/**
 * 
 * @param {'ECDSA'|'ECDH'} name 
 * @param {256|384|521} curve 
 */
export function generateEC(name, curve){
  return subtle.generateKey({name, namedCurve : `P-${curve}`}, true, getUsages(name === 'ECDH' ? DERIVE : SIGN_VERIFY))
}

/**
 * 
 * @param {1|256|384|521} hash 
 */
export function generateHMAC(hash){
  return subtle.generateKey({name : 'HMAC', hash : `SHA-${hash}`}, true, getUsages(SIGN_VERIFY)) 
}

/**
 * 
 * @param {'GCM'|'CBC'|'CTR'} name 
 * @param {128|256} length 
 * @param {number} usages
 */
export function generateAES(name, length, usages = ENC_DEC){
  return subtle.generateKey({name : `AES-${name}`, length}, true, getUsages(usages))
}

/**
 * 
 * @param {KeyFormat} type 
 * @param {CryptoKey} wrapper_key used to encrypt the exported key
 * @param {CryptoKey} key 
 * @param {AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams} alg
 * @returns 
 */
export function wrapKey(type, wrapper_key, key, alg){
  return subtle.wrapKey(type, key, wrapper_key, {name : wrapper_key.algorithm.name, ...alg})
}

/**
 * 
 * @param {KeyFormat} type 
 * @param {BufferSource} data 
 * @param {CryptoKey} wrapper_key 
 * @param {AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams} wrap_alg 
 * @param {AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm} alg 
 * @param {number} usages 
 */
export function unwrapKey(type, data, wrapper_key, wrap_alg, alg, usages){
  return subtle.unwrapKey(type, data, wrapper_key, wrap_alg, alg, true, getUsages(usages))
}