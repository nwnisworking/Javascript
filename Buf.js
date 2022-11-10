class Buf extends Array{
	#offset = 0

	constructor(data = []){
		super()

		if(Array.isArray(data))
			data = Uint8Array.from(data)

		this.#write(data, 0)

		return new Proxy(this, {
			get(p, f){
				const match = f.toLowerCase().match(/.{3}([^\d]+)(\d+)/)

				if(typeof p[f] !== 'function') 
					return p[f]
				else if(!match)
					return p[f].bind(p)

				const [,type, bit] = match
				
				return (...arg)=>{
					if(f.includes('set')){
						let [value, {isLE = false, offset = null} = {}] = arg
						return p.#set(BigInt(value), isLE, offset, type, BigInt(bit))
					}
					else if(f.includes('get')){
						let [offset, isLE = false] = arg
						return p.#get(!offset ? null  : BigInt(offset), isLE, type, BigInt(bit))
					}
				}
			}
		})
	}

	setUint8(value, offset){}
	setInt8(value, offset){}
	setUint16(value, {offset, isLE = false}){}
	setInt16(value, {offset, isLE = false}){}
	setUint32(value, {offset, isLE = false}){}
	setInt32(value, {offset, isLE = false}){}
	setUint64(value, {offset, isLE = false}){}
	setInt64(value, {offset, isLE = false}){}

	getUint8(offset){}
	getInt8(offset){}
	getUint16(offset, isLE = false){}
	getInt16(offset, isLE = false){}
	getUint32(offset, isLE = false){}
	getInt32(offset, isLE = false){}
	getUint64(offset, isLE = false){}
	getInt64(offset, isLE = false){}

	insert(offset, arr = []){
		this.splice(offset, 0, ...arr.map(e=>e % 256))
		return this
	}

	delete(offset, length){
		this.splice(offset, length)
		return this
	}

	#write(arr, offset = null){
		const {length} = this
		offset = offset ?? length

		for(let i = length < offset ? length : offset; i < arr.length + offset; i++)
			this[i] = arr[i - offset] ?? 0 
		
	}

	#read(offset, length = 1){
		return this.slice(offset, offset + length)
	}

	#dec2uint(value){
		return value.toString(16).match(/.{1,2}/g).map(e=>parseInt(e, 16))
	}

	#set(value, endian, offset, type, bit){
		const {x, y, size} = Buf.range(bit, type)
	
		if(value < x || value > y)
			throw new Error(`Value must be between ${x} and ${y}`)

		if(type === 'int')
			value = value & (size - 1n)

		value = this.#dec2uint(value)

		while(value.length != bit / 8n)
			value.push(0)

		if(endian)
			value = value.reverse()

		this.#write(value, offset)

		return this
	}

	#get(offset, endian, type, bit){
		if(!offset) offset = this.#offset
		const {size, y} = Buf.range(bit, type)
		let val = this.#read(Number(offset), Number(bit) / 8),
		total = 0n

		if(endian)
			val = val.reverse()

		for(let i = 0n; i < val.length; i++)
			total+= BigInt(val[i]) << (i * 8n)

		this.#offset+= Number(bit / 8n)
		return type === 'uint' ? total : (total > y ? total - size : total)
	}

	static range(bit, type){
		if(bit % 8n !== 0n) 
			throw new Error('bit not divisible by 8')
		
		const y = (1n << (bit - BigInt(type !== 'uint' ))) - 1n,
		x = type !== 'uint' ? ~y : 0

		return {x, y, size : 1n << bit}
	}
}
