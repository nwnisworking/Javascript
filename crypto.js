/**
 * @typedef {string|ArrayBuffer|ArrayBufferView} ByteSource A source of bytes that can be converted to a Uint8Array.
 *
 * @typedef {1|256|384|512} SHAType Available SHA hash types.
 *
 * @typedef {'P-256'|'P-384'|'P-521'} ECType Available elliptic curves for EC key generation.
 */

const crypto = globalThis.crypto
const subtle = crypto?.subtle
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const importKey = subtle?.importKey?.bind(subtle)
export const exportKey = subtle?.exportKey?.bind(subtle)
export const generateKey = subtle?.generateKey?.bind(subtle)

export const AES_GCM_IV = 12
export const AES_CBC_IV = 16
export const AES_CTR_IV = 16


/**
 * Returns the key usages for a given algorithm.
 *
 * @param {Algorithm} algorithm
 * @returns {KeyUsage[]}
 * @throws {Error} If the algorithm is unsupported.
 */
function getKeyUsages(algorithm){
	switch(algorithm.name){
		case 'AES-GCM':
		case 'AES-CBC':
		case 'AES-CTR':
			return ['encrypt', 'decrypt']

		case 'AES-KW':
			return ['wrapKey', 'unwrapKey']

		case 'HMAC':
			return ['sign', 'verify']

		case 'HKDF':
		case 'PBKDF2':
			return []

		default:
			throw new Error(
				`Unsupported derived key algorithm: ${algorithm.name}`
			)
	}
}

/**
 * Cipher class for encrypting and decrypting data and wrapping and unwrapping keys.
 */
export class Cipher{
	#key

	/**
	 * Creates a new Cipher instance.
	 *
	 * @param {CryptoKey} key The key to use for cryptographic operations.
	 */
	constructor(key){
		if(!key)
			throw new Error('key is required')

		if(!(key instanceof CryptoKey))
			throw new TypeError(
				'key must be an instance of CryptoKey'
			)

		this.#key = key
	}

	/**
	 * Encrypts data using the current key.
	 *
	 * @param {ByteSource} data The data to encrypt.
	 * @param {AesGcmParams|AesCbcParams|AesCtrParams|RsaOaepParams} parameters Algorithm-specific encryption parameters.
	 * @returns {Promise<ArrayBuffer>} The encrypted data.
	 */
	encrypt(data, parameters){
		return subtle.encrypt(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			data
		)
	}

	/**
	 * Decrypts data using the current key.
	 *
	 * @param {ByteSource} data The encrypted data.
	 * @param {AesGcmParams|AesCbcParams|AesCtrParams|RsaOaepParams} parameters Algorithm-specific decryption parameters.
	 * @returns {Promise<ArrayBuffer>} The decrypted data.
	 */
	decrypt(data, parameters){
		return subtle.decrypt(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			data
		)
	}

	/**
	 * Wraps a key using the current key.
	 *
	 * @param {KeyFormat} format The format in which the key should be exported before wrapping.
	 * @param {CryptoKey} key The key to wrap.
	 * @returns {Promise<ArrayBuffer>} The wrapped key.
	 */
	wrapKey(format, key){
		return subtle.wrapKey(
			format,
			key,
			this.#key,
			{
				name: this.#key.algorithm.name
			}
		)
	}

	/**
	 * Unwraps a key using the current key.
	 *
	 * @param {KeyFormat} format The format of the wrapped key.
	 * @param {BufferSource} wrappedKey The wrapped key data.
	 * @param {AlgorithmIdentifier} algorithm The algorithm of the unwrapped key.
	 * @param {KeyUsage[]} usages The usages allowed for the unwrapped key.
	 * @returns {Promise<CryptoKey>} The unwrapped CryptoKey.
	 */
	unwrapKey(format, wrappedKey, algorithm, usages){
		return subtle.unwrapKey(
			format,
			wrappedKey,
			this.#key,
			{
				name: this.#key.algorithm.name
			},
			algorithm,
			true,
			usages
		)
	}
}

/**
 * Signer class for signing and verifying data using a CryptoKey.
 */
export class Signer{
	#key

	/**
	 * Creates a new Signer instance.
	 *
	 * @param {CryptoKey} key The key to use for signing and verification.
	 */
	constructor(key){
		if(!key)
			throw new Error('key is required')

		if(!(key instanceof CryptoKey))
			throw new TypeError(
				'key must be an instance of CryptoKey'
			)

		this.#key = key
	}

	/**
	 * Signs data using the current key.
	 *
	 * @param {ByteSource} data The data to sign.
	 * @param {RsaPssParams|EcdsaParams} parameters Algorithm-specific signing parameters.
	 * @returns {Promise<ArrayBuffer>} The generated signature.
	 */
	sign(data, parameters){
		return subtle.sign(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			data
		)
	}

	/**
	 * Verifies a signature against data using the current key.
	 *
	 * @param {BufferSource} signature The signature to verify.
	 * @param {BufferSource} data The original data that was signed.
	 * @param {RsaPssParams|EcdsaParams} parameters Algorithm-specific verification parameters.
	 * @returns {Promise<boolean>} Whether the signature is valid.
	 */
	verify(signature, data, parameters){
		return subtle.verify(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			signature,
			data
		)
	}
}

/**
 * Deriver class for deriving shared secrets and keys using a CryptoKey.
 */
export class Deriver{
	#key

	/**
	 * Creates a new Deriver instance.
	 *
	 * @param {CryptoKey} key The key to use for derivation.
	 */
	constructor(key){
		if(!key)
			throw new Error('key is required')

		if(!(key instanceof CryptoKey))
			throw new TypeError(
				'key must be an instance of CryptoKey'
			)

		this.#key = key
	}

	/**
	 * Derives raw bits using the current key.
	 *
	 * @param {EcdhKeyDeriveParams|HkdfParams|Pbkdf2Params} parameters Algorithm-specific derivation parameters.
	 * @param {number} length The number of bits to derive.
	 * @returns {Promise<ArrayBuffer>} The derived bits.
	 */
	deriveFrom(parameters, length){
		return subtle.deriveBits(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			length
		)
	}

	/**
	 * Derives a CryptoKey using the current key.
	 *
	 * @param {EcdhKeyDeriveParams|HkdfParams|Pbkdf2Params} parameters Algorithm-specific derivation parameters.
	 * @param {AesDerivedKeyParams|HmacImportParams} derivedKeyType The algorithm and parameters of the derived CryptoKey.
	 * @returns {Promise<CryptoKey>} The derived CryptoKey.
	 */
	deriveKeyFrom(parameters, derivedKeyType){
		if(
			derivedKeyType.name === 'HKDF' ||
			derivedKeyType.name === 'PBKDF2'
		)
			throw new Error(
				`Derived key algorithm ${derivedKeyType.name} is not supported for deriveKeyFrom`
			)

		const usages = getKeyUsages(derivedKeyType)

		return subtle.deriveKey(
			{
				...parameters,
				name: this.#key.algorithm.name
			},
			this.#key,
			derivedKeyType,
			true,
			usages
		)
	}
}


/**
 * Converts a value to a Uint8Array.
 *
 * @param {ByteSource} value The value to convert.
 * @returns {Uint8Array} The converted Uint8Array.
 */
function toBytes(value){
	if(value instanceof Uint8Array)
		return value

	if(ArrayBuffer.isView(value))
		return new Uint8Array(
			value.buffer,
			value.byteOffset,
			value.byteLength
		)

	if(value instanceof ArrayBuffer)
		return new Uint8Array(value)

	if(typeof value === 'string')
		return encoder.encode(value)

	throw new TypeError(
		'Expected a string, ArrayBuffer, or ArrayBufferView'
	)
}

/**
 * Encodes a string into UTF-8 bytes.
 *
 * @param {string} value - The string to encode.
 * @returns {Uint8Array} The UTF-8 encoded bytes.
 */
export function encode(value){
  return encoder.encode(value)
}

/**
 * Decodes UTF-8 bytes into a string.
 *
 * @param {BufferSource} value - The bytes to decode.
 * @returns {string} The decoded string.
 */
export function decode(value){
	return decoder.decode(value)
}

/**
 * Encodes bytes as a Base64 string.
 *
 * @param {ByteSource} value - The value to encode.
 * @returns {string} The Base64 encoded string.
 */
export function base64(value){
	const bytes = toBytes(value)

	if(typeof Buffer !== 'undefined')
		return Buffer.from(bytes).toString('base64')

	let binary = ''

	for(const byte of bytes)
		binary += String.fromCharCode(byte)

	return btoa(binary)
}


/**
 * Decodes a Base64 string into bytes.
 *
 * @param {string} value - The Base64 string to decode.
 * @returns {Uint8Array} The decoded bytes.
 */
export function fromBase64(value){
	if(typeof Buffer !== 'undefined')
		return new Uint8Array(Buffer.from(value, 'base64'))

	const binary = atob(value)
	const bytes = new Uint8Array(binary.length)

	for(let index = 0; index < binary.length; index += 1)
		bytes[index] = binary.charCodeAt(index)

	return bytes
}

/**
 * Encodes bytes as a Base64URL string.
 *
 * @param {ByteSource} value - The value to encode.
 * @returns {string} The Base64URL encoded string.
 */
export function base64URL(value){
	return base64(value)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '')
}


/**
 * Decodes a Base64URL string into bytes.
 *
 * @param {string} value - The Base64URL string to decode.
 * @returns {Uint8Array} The decoded bytes.
 */
export function fromBase64URL(value){
	let normalized = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')

	while(normalized.length % 4)
		normalized += '='

	return fromBase64(normalized)
}

/**
 * Encodes bytes as a hexadecimal string.
 *
 * @param {ByteSource} value - The value to encode.
 * @returns {string} The hexadecimal encoded string.
 */
export function hex(value){
	const bytes = toBytes(value)

	let output = ''

	for(const byte of bytes)
		output += byte.toString(16).padStart(2, '0')

	return output
}


/**
 * Decodes a hexadecimal string into bytes.
 *
 * @param {string} value - The hexadecimal string to decode.
 * @returns {Uint8Array} The decoded bytes.
 */
export function fromHex(value){
	if(!/^(?:[0-9a-fA-F]{2})*$/.test(value))
		throw new TypeError(
			'Hexadecimal value must contain an even number of hexadecimal characters'
		)

	const bytes = new Uint8Array(value.length / 2)

	for(let index = 0; index < value.length; index += 2)
		bytes[index / 2] = parseInt(
			value.slice(index, index + 2),
			16
		)

	return bytes
}

/**
 * Generates cryptographically secure random bytes.
 *
 * @param {number} length The number of random bytes to generate.
 * @returns {Uint8Array} The generated random bytes.
 * @throws {TypeError} If length is not a non-negative integer.
 * @throws {RangeError} If length exceeds the Web Crypto limit.
 */
export function randomBytes(length){
	if(!crypto?.getRandomValues)
		throw new Error(
			'crypto.getRandomValues is not available'
		)

	if(!Number.isInteger(length) || length < 0)
		throw new TypeError(
			'length must be a non-negative integer'
		)

	if(length > 65536)
		throw new RangeError(
			'length must not exceed 65536 bytes'
		)

	return crypto.getRandomValues(
		new Uint8Array(length)
	)
}

/**
 * Generates a random UUID.
 *
 * @returns {string} A randomly generated UUID.
 */
export function randomUUID(){
	if(!crypto?.randomUUID)
		throw new Error(
			'crypto.randomUUID is not available'
		)

	return crypto.randomUUID()
}

/**
 * Computes a SHA digest of the given data.
 *
 * @param {SHAType} type The SHA hash size to use.
 * @param {ByteSource} value The data to digest.
 * @returns {Promise<ArrayBuffer>} The resulting digest.
 */
export function digest(type, value){
	if(!subtle?.digest)
		throw new Error(
			'crypto.subtle.digest is not available'
		)

	return subtle.digest(
		`SHA-${type}`,
		toBytes(value)
	)
}

/**
 * Generates an RSA key pair for the specified algorithm.
 *
 * @param {'RSA-PSS'|'RSA-OAEP'} name - The RSA algorithm to use.
 * @param {number} modulusLength - The RSA modulus length in bits.
 * @param {HashAlgorithmIdentifier} hash - The hash algorithm to use.
 * @returns {Promise<CryptoKeyPair>} A Promise that resolves to an RSA key pair.
 */
export function generateRSA(name = 'RSA-OAEP', modulusLength = 2048, hash = 'SHA-256'){
	if(!subtle?.generateKey)
		throw new Error('crypto.subtle.generateKey is not available')

	let usages

	if(name === 'RSA-PSS')
		usages = ['sign', 'verify']
	else if(name === 'RSA-OAEP')
		usages = ['encrypt', 'decrypt']
	else
		throw new Error(`Unsupported RSA algorithm: ${name}`)

	return subtle.generateKey(
		{
			name,
			modulusLength,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash
		},
		true,
		usages
	)
}

/**
 * Generates an ECDH key pair.
 *
 * @param {ECType} curve The elliptic curve to use.
 *
 * @returns {Promise<CryptoKeyPair>} The generated ECDH key pair.
 */
export function generateECDH(curve){
	if(!subtle?.generateKey)
		throw new Error(
			'crypto.subtle.generateKey is not available'
		)

	return subtle.generateKey(
		{
			name: 'ECDH',
			namedCurve: curve
		},
		true,
		[
			'deriveKey',
			'deriveBits'
		]
	)
}

/**
 * Generates an ECDSA key pair.
 *
 * @param {ECType} curve The elliptic curve to use.
 * @returns {Promise<CryptoKeyPair>} The generated ECDSA key pair.
 */
export function generateECDSA(curve){
  if(!subtle?.generateKey)
    throw new Error(
      'crypto.subtle.generateKey is not available'
    )

  return subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: curve
    },
    true,
    [
      'sign',
      'verify'
    ]
  )
}

/**
 * Generates an AES key for the specified algorithm.
 *
 * @param {'AES-GCM'|'AES-CBC'|'AES-CTR'|'AES-KW'} name - The AES algorithm to use.
 * @param {128|192|256} length - The AES key length in bits.
 * @returns {Promise<CryptoKey>} A Promise that resolves to an AES CryptoKey.
 */
export function generateAES(name = 'AES-GCM', length = 256){
	if(!subtle?.generateKey)
		throw new Error('crypto.subtle.generateKey is not available')

	if(
		name !== 'AES-GCM' &&
		name !== 'AES-CBC' &&
		name !== 'AES-CTR' &&
		name !== 'AES-KW'
	)
		throw new Error(`Unsupported AES algorithm: ${name}`)

	return subtle.generateKey({
			name,
			length
		}, true, getKeyUsages({ name })
	)
}

/**
 * Generates an HMAC key.
 *
 * @param {'SHA-256'|'SHA-384'|'SHA-512'} hash - The hash algorithm to use.
 * @param {number} length - The HMAC key length in bits.
 * @returns {Promise<CryptoKey>} A Promise that resolves to an HMAC CryptoKey.
 */
export function generateHMAC(hash = 'SHA-256', length = 256){
	if(!subtle?.generateKey)
		throw new Error('crypto.subtle.generateKey is not available')

	return subtle.generateKey({
    name: 'HMAC',
    hash,
    length
  }, true, ['sign', 'verify'])
}