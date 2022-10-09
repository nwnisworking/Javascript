import Buffer from "./buffer.js"

export default class Data extends Array{
	#offset = 0

	get offset(){ return this.#offset }

	constructor(data){
		super()

		this.writeBuf(0, data)
	}

	writeBuf(offset, data = []){
		const { length } = this
		offset = Number.isInteger(offset) ? offset : length
		const total_length = offset + data.length
		let i = length < offset ? length : offset

		for(; i < total_length; i++)
			this[i] = i < offset && length < offset ? 0 : data[i - offset] % 256

		return this
	}

	readBuf(offset, length = 1){
		offset = !length ? this.#offset : offset
		this.#offset+= !length ? offset : 0
		return this.slice(offset, offset + length)			
	}

	#_getUint(bit, offset, little_endian){
		offset = offset ? offset : this.offset
		let val = this.readBuf(offset, bit / 8).map(BigInt),
		total = 0n

		if(!little_endian) 
			val = val.reverse()

		for(let i = 0n; i < val.length; i++)
			total+= val[i] << i * 8n
		
		return total
	}

	#_getInt(bit, offset, little_endian){
		const val = this.#_getUint(bit, offset, little_endian),
		size = 1n << BigInt(bit)
		return val > size / 2n - 1n ? val - size : val
	}

	#_getFloat(bit, offset, little_endian){
		const val = this.#_getUint(bit, offset, little_endian)
		bit = BigInt(bit)
		const expo = {16 : 5n, 32 : 8n, 64 : 11n}[bit],
		bias = (1n << expo) / 2n - 1n
		const 
			total_bit = bit - 1n,
			_ = total_bit - expo
			sig_bit = val & (1n << total_bit),
			expo_bit = val - sig_bit >> _ << _,
			mant_bit = val - sig_bit - expo_bit

		let log = 1,
		v = 1

		for(let i = 0n; i < _; i++){

			log/= 2
			if(mant_bit & (1n << _ - 1n - i))
				v+= log
		}

		return v * 
			(2 ** Number((expo_bit >> (total_bit - expo)) - bias)) * 
			(sig_bit == 0 ? 1 : -1)
	}

	#_setUint(value, bit, offset, little_endian){
		const {x, y} = this.constructor.range(bit)

		if(value < x || value > y) 
			throw new Error(`Value must be between ${x} and ${y}`)
		
		value = value.toString(16).match(/.{1,2}/g).map(e=>parseInt(e, 16))

		while(value.length !== bit / 8)
			value.push(0)

		this.writeBuf(offset, little_endian ? value.reverse() : value)
	}

	#_setInt(value, bit, offset, little_endian){
		const {x, y, size} = this.constructor.range(bit, true)

		if(value < x || value > y) 
			throw new Error(`Value must be between ${x} and ${y}`)

		this.#_setUint(BigInt(value) & (size - 1n), bit, offset, little_endian)
	}

	#_setFloat(value, bit, offset, little_endian){
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

		const res = sign_bit << (bit - 1n) | bias + expo << bit - expo_bit - 1n | bin

		this.#_setUint(res, Number(bit), offset, little_endian)
	}

	setFloat16(value, offset, little_endian = false){
		return this.#_setFloat(value, 16, offset, little_endian)
	}

	setFloat32(value, offset, little_endian = false){
		return this.#_setFloat(value, 32, offset, little_endian)
	}

	setFloat64(value, offset, little_endian = false){
		return this.#_setFloat(value, 64, offset, little_endian)
	}

	setUint8(value, offset){
		return this.#_setUint(value, 8, offset)
	}

	setInt8(value, offset){
		return this.#_setInt(value, 8, offset)
	}

	setUint16(value, offset){
		return this.#_setUint(value, 16, offset)
	}

	setInt16(value, offset){
		return this.#_setInt(value, 16, offset)
	}

	setUint16(value, offset){
		return this.#_setUint(value, 16, offset)
	}

	setInt16(value, offset){
		return this.#_setInt(value, 16, offset)
	}

	setUint32(value, offset){
		return this.#_setUint(value, 32, offset)
	}

	setInt32(value, offset){
		return this.#_setInt(value, 32, offset)
	}

	setUint64(value, offset){
		return this.#_setUint(value, 64, offset)
	}

	setInt64(value, offset){
		return this.#_setInt(value, 64, offset)
	}

	getUint8(offset){
		return this.#_getUint(8, offset)
	}

	getInt8(offset){
		return this.#_getInt(8, offset)
	}

	getUint16(offset, little_endian = false){
		return this.#_getUint(16, offset, little_endian)
	}

	getInt16(offset, little_endian = false){
		return this.#_getInt(16, offset, little_endian)
	}

	getUint32(offset, little_endian = false){
		return this.#_getUint(32, offset, little_endian)
	}

	getInt32(offset, little_endian = false){
		return this.#_getInt(32, offset, little_endian)
	}

	getFloat16(offset, little_endian = false){
		return this.#_getFloat(16, offset, little_endian)
	}

	getFloat32(offset, little_endian = false){
		return this.#_getFloat(32, offset, little_endian)
	}

	getFloat64(offset, little_endian = false){
		return this.#_getFloat(64, offset, little_endian)
	}

	static range(bit, is_int = false){
		if(bit % 8 !== 0) throw new Error('Not a bit integer value')

		bit = BigInt(bit)

		const size = 1n << bit,
		y = !is_int ? size - 1n : size / 2n - 1n,
		x = !is_int ? 0 : ~y

		return {x, y, size}
	}
}
