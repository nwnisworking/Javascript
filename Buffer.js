export default class Buffer extends Array{
	#offset = 0
	#encoder = new TextEncoder()
	#decoder = new TextDecoder()

	get offset(){ return this.#offset }

	constructor(data = []){
		super()

		if(Array.isArray(data))
			data = Uint8Array.from(data)

		for(let i = 0; i < data.length; i++)
			this.push(data[i])

		return new Proxy(this, {
			get(target, func){
				if(typeof target[func] !== 'function')
					return target[func]
				return (...args)=>{
					let [val] = args
					if(
						func !== Symbol.iterator &&
						func.includes('write') && 
						typeof val === 'number' && 
						val === parseInt(val)
					)
						args[0] = BigInt(val)
					return target[func].apply(target, args)
				}
			}
		})
	}

	insert(buffer, offset = 0){
		this.splice(offset, 0, ...buffer)
		return this
	}

	write(text, offset = null){ return this.#set(this.#encoder.encode(text), offset) }

	writeHalf(value, {offset = null, endian = 'BE'} = {}){ return this.#set(this.#write_float(value, 16), offset, {bit : 16, endian}) }

	writeSingle(value, {offset = null, endian = 'BE'} = {}){ return this.#set(this.#write_float(value, 32), offset, {bit : 32, endian}) }

	writeDouble(value, {offset = null, endian = 'BE'} = {}){ return this.#set(this.#write_float(value, 64), offset, {bit : 64, endian}) }

	writeUint8(value, offset = null){ return this.#set(value, offset, {bit : 8}) }

	writeInt8(value, offset = null){ return this.#set(value, offset, {bit : 8, type : 'signed'}) }

	writeUint16(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 16}) }

	writeInt16(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 16, type : 'signed'}) }

	writeUint32(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 32}) }

	writeInt32(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 32, type : 'signed'}) }

	writeUint64(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 64}) }

	writeInt64(value, {offset = null, endian = 'BE'} = {}){ return this.#set(value, offset, {endian, bit : 64, type : 'signed'}) }

	read(offset, length = null){
		const empty_len = !length

		length = empty_len ? offset : length
		offset = empty_len ? this.offset : offset

		this.#offset+= empty_len ? length : 0
		return this.slice(offset, length + offset)
	}

	skip(offset){
		this.offset+= offset
		return this
	}

	// read(offset, length = null){
	// 	// Might as well use slice instead. Will change the code later
	// 	const arr = [],
	// 	empty_len = !length

	// 	length = empty_len ? offset : length
	// 	offset = BigInt(empty_len ? this.offset : offset)


	// 	for(let i = offset; i < BigInt(length) + offset; i++)
	// 		arr.push(this[i])

	// 	this.#offset+= Number(empty_len ? length : 0)
	// 	return new Buffer(arr)
	// }

	readHalf(offset, endian = 'BE'){ return this.#readFloat(this.#read(offset, {bit : 16, endian}), 16) }

	readSingle(offset, endian = 'BE'){ return this.#readFloat(this.#read(offset, {bit : 32, endian}), 32) }

	readDouble(offset, endian = 'BE'){ return this.#readFloat(this.#read(offset, {bit : 64, endian}), 64) }

	readUint8(offset = null){ return this.#read(offset, {bit : 8}) }

	readInt8(offset = null){ return this.#read(offset, {bit : 8, type : 'signed'}) }

	readUint16(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 16}) }

	readInt16(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 16, type : 'signed'}) }

	readUint32(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 32}) }

	readInt32(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 32, type : 'signed'}) }

	readUint64(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 64}) }

	readInt64(offset = null, endian = 'BE'){ return this.#read(offset, {endian, bit : 64, type : 'signed'}) }

	toHex(){return this.map(e=>e.toString(16).padStart(2, 0)).join('')}

	toString(){return this.#decoder.decode(Uint8Array.from(this))}

	/**
	 * Set array with data 
	 * @param {BigInt|Uint8Array|Array} value 
	 * @param {number} offset 
	 * @param {object} param2 
	 * @param {'unsigned'|'signed'} param2.type 
	 * @param {number} param2.bit 
	 * @param {'BE'|'LE'} param2.endian 
	 * @returns 
	 */
	#set(value, offset = null, {type = 'unsigned', bit, endian = 'BE'} = {}){
		const {length} = this
		offset = Number.isInteger(offset) ? offset : length
		if(typeof value === 'bigint'){
			const {x, y, value : size} = this.#getRange(bit, type)

			if(value < x || value > y) 
				throw new Error(`Value must be between ${x} and ${y}`)
	
			if(type === 'signed')
				value = value & (size - 1n)
	
			value = value.toString(16).match(/.{1,2}/g).map(e=>parseInt(e, 16))
			
			while(value.length !== bit / 8)
				value.push(0)
	
			if(endian !== 'BE')
				value = value.reverse()
		}
		else{
			value = Array.from(value)
		}

		// f**k me i don't know how to explain this mess. guess if it works then it works
		for(let i = length < offset ? length : offset; i < offset + value.length; i++)
			this[i] = i < offset && length < offset ? 0 : value[i - offset]

	}

	/**
	 * 
	 * @param {number} offset 
	 * @param {object} param1 
	 * @param {'unsigned'|'signed'} param1.type 
	 * @param {number} param1.bit 
	 * @param {'BE'|'LE'} param1.endian 

	 * @returns 
	 */
	#read(offset, {type = 'unsigned', bit, endian = 'BE'} = {}){
		const {x, y, value : size} = this.#getRange(bit, type),
		empty_offset = !offset

		offset = empty_offset ? this.offset : offset

		let temp = 0n

		// less of a clusterf**k compared to set. 
		for(let i = offset; i < offset + bit / 8; i++){
			const index = endian === 'BE' ? 
			offset + (bit / 8) - i - 1 :
			i - offset

			if(!this[i]) break

			temp+= BigInt(this[i]) << BigInt(index * 8)
		}

		this.#offset+= empty_offset ? bit / 8 : 0

		return type === 'unsigned' ? temp : (temp > y ? temp - size : temp)
	}

	/**
	 * Get the range of bits
	 * @param {number} bit 
	 * @param {'unsigned'|'signed'} type 
	 */
	#getRange(bit, type){
		if(bit % 8 !== 0)
			throw new Error('bit not divisible by 8')

		const value = BigInt(2 ** bit),
		val = value - 1n,
		y = BigInt(type === 'unsigned' ? val : val / 2n),
		x = BigInt(type === 'unsigned' ? 0n : y - val)
		return {x, y, value}	
	}

	/**
	 * Float write handler to convert float into a bigint 
	 * @param {number|bigint} value 
	 * @param {16|32|64} bit 
	 */
	#write_float(value, bit = 16){
		if(typeof value === 'bigint')
			throw new Error('Bigint not supported for float')

		bit = BigInt(bit)

		const expo_bit = {16 : 5n, 32 : 8n, 64 : 11n}[bit],
		sig_bit = bit - expo_bit,
		sign_bit = BigInt(value < 0),
		zero = parseInt(value) === 0,
		bias = (1n << expo_bit) / 2n - 1n,
		[int, dec] = Math.abs(value).toString(2).split('.'),
		expo = BigInt(zero ? -Math.abs(dec.indexOf(1) + 1) : int.length - 1)
		let bin = ''

		if(zero)
			bin = dec.slice(Number(expo) * -1)
		else
			bin = (int + dec).slice(1).padEnd(Number(bit), 0)

		bin = BigInt(`0b${bin.slice(0, Number(sig_bit))}`)

		if((bin & 1n) === 1n)
			bin+= 1n
		bin>>= 1n

		return sign_bit << (bit - 1n) | bias + expo << bit - expo_bit - 1n | bin
	}

	/**
	 * Float read handler
	 * @param {bigint} value 
	 * @param {16|32|64} bit 
	 */
	#readFloat(value, bit = 16){
		value = value.toString(2).padStart(bit, 0)
		bit = BigInt(bit)
		const expo_bit = {16 : 5n, 32 : 8n, 64 : 11n}[bit],
		bias = (1n << expo_bit) / 2n - 1n,
		sign = value.slice(0, 1),
		expo = BigInt('0b' + value.slice(1, Number(expo_bit) + 1)) - bias,
		sig = value.slice(Number(expo_bit) + 1)
		
		let temp = 1, val = 0

		for(let i = 0, str = sig; i < str.length; i++){
			temp/= 2
			if(str[i] == 1)
				val+= temp
		}

		val+= 1

		return (val * (2 ** Number(expo))) * (sign == 0 ? 1 : -1)
	}

	/**
	 * Convert values / floats into binary
	 * @param {number|BigInt} value 
	 * @param {boolean} is_frac 
	 */
	static bits(value, is_frac = false){
		let str = '',
		type = typeof value

		if(type === 'bigint'){
			value = value < 0n ? value * -1n : value
		}
		else{
			value = Math.abs(value)
			value = is_frac ? value - parseInt(value) : parseInt(value)
		}

		do{
			if(type === 'bigint'){
				str = str.padStart(str.length + 1, value & 1n)
				value>>= 1n
			}
			else{
				if(!is_frac){
					str = str.padStart(str.length + 1, value & 1)
					value>>= 1
				}
				else{
					str+= ((value*= 2) >= 1) * 1
					if(str[str.length - 1] == 1)
						value-= Math.floor(value)
				}
			}
		}
		while(value)

		return str
	}
}
