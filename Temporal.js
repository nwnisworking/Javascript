export default class Temporal{
	#date

	constructor(date = null){
		const new_date = {
			year : 0,
			month : 0,
			date : 1,
			hour : 0,
			minute : 0,
			second : 0,
			ms : 0,
			...date
		}

		if(date)
			switch(date.constructor.name){
				case 'Object' : 
					this.#date = new Date(new_date.year, new_date.month, new_date.date, new_date.hour, new_date.minute, new_date.second, new_date.ms)
				break
				case 'Date' : 
				case 'String' : 
				case 'Number' : 
					this.#date = new Date(date)
				break
			}
		else
			this.#date = new Date()
		
	}

	year(year = null){
		if(year) this.#date.setFullYear(year)
		else return this.#date.getFullYear()
		return this
	}

	month(month = null){
		let name = [
			'january',
			'february',
			'march',
			'april',
			'may',
			'june',
			'july',
			'august',
			'september',
			'october',
			'november',
			'december'
		]

		if(typeof month === 'string'){
			month = month.toLowerCase()

			if(month.length === 3)
				name = name.map(e=>e.slice(0, 3))
			month = name.indexOf(month)
		}

		if(month > -1) this.#date.setMonth(month)
		else return this.#date.getMonth()
		return this
	}

	date(date = null){
		if(date) this.#date.setDate(date)
		else return this.#date.getDate()
		return this
	}

	hour(hour = null){
		if(hour) this.#date.setHours(hour)
		else return this.#date.getHours()
		return this
	}

	minute(minute = null){
		if(minute) this.#date.setMinutes(minute)
		else return this.#date.getMinutes()
		return this
	}

	second(second = null){
		if(second) this.#date.setSeconds(minute)
		else return this.#date.getSeconds()
		return this
	}

	ms(ms = null){
		if(ms) this.#date.setMilliseconds(ms)
		else return this.#date.getMilliseconds()
		return this
	}

	lastDate(){
		const months = [31, this.leapYear() ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
		return months[this.month()]
	}

	leapYear(){
		return !(this.year()%4)&&(!(this.year()%400)||!!(this.year()%100))
	}

	to(date){
		if(!(date instanceof Temporal))
			date = new Temporal(date)

		return Math.ceil((date.timestamp() - this.timestamp()) / 8.65e+7)
	}

	timestamp(){
		return this.#date.getTime()
	}

	dayOfWeek(){
		return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][this.#date.getDay()]
	}
}