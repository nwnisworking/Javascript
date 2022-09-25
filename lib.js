/**
 * Returns the first result that is a valid value 
 * @param  {...any} arr 
 * @returns {any}
 */
export function or(...arr){
	return arr.find(e=>e)
}
/**
 * Returns the first result after all the parameters are valid
 * @param  {...any} arr 
 * @returns {any}
 */
export function and(...arr){
	return arr.every(e=>!!e) && arr.find(e=>e)
}
/**
 * Traverse object and return all the keys 
 * @param {object} obj 
 * @param {string} key 
 * @returns {Array}
 */
export function traverse(obj, key = ''){
	if(!obj)
		return [key]

	return Object.keys(obj).reduce((p,c)=>{
		const _ = obj[c]
		if(typeof _ === 'object' && !Array.isArray(_))
			p.push(...traverse(_, [key, c].filter(Boolean).join('.')))
		else
			p.push([key, c].filter(Boolean).join('.'))
		return p 
	}, [])
}
/**
 * Identify if object match class type
 * @param {any} obj 
 * @param {any} match 
 * @returns {boolean}
 */
export function is(obj, match){
	return obj.constructor.name === match.name
}
/**
 * Swap characters 
 * @param {string} str 
 * @param {string|object} from 
 * @param {string|null} to 
 * @returns {string}
 */
export function swap(str, from, to = null){
	const mapper = is(from, Object) ? from : {}

	if(is(from, String)){
		if(!to) throw new Error('to is not a string')
		to = to.split('')
		from.split('').forEach((e,i)=>mapper[e] = to[i] || '')
	}
	return str.replace(
		new RegExp(`(${Object.keys(mapper).map(escapeRegex).join('|')})`, 'g'), 
		e=>mapper[e]
	)
}
/**
 * Escape string from regex special characters
 * @param {string} str 
 * @returns {string}
 */
export function escapeRegex(str){
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
/**
 * get the range of unsigned/signed bits 
 * @param {number} bit 
 * @param {'unsigned'|'signed'} type 
 */
export function bitRange(bit, type = 'unsigned'){
	if(bit % 8 !== 0)
		throw new Error('bit not divisible by 8')
	const value = 2 ** bit,
	val = value - 1,
	y = type === 'unsigned' ? val : Math.floor(val / 2),
	x = type === 'unsigned' ? 0 : y - val
	return {x, y, value}
}