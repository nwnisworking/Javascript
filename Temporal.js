export default class Temporal{
  /**
   * The date object 
   * @property {object} date
   */
  #date = {
    year : null,
    month : null,
    date : null,
    hour : null,
    minute : null,
    second : null,
    ms : null
  }

  /**
   * @overload
   * @param {Date|string|number|undefined} date 
   * 
   * @overload
   * @param {object} date
   * @param {number} date.year
   * @param {?number} date.month
   * @param {?number} date.date
   * @param {?number} date.hour
   * @param {?number} date.minute
   * @param {?number} date.second
   * @param {?number} date.ms
   */
  constructor(date){
    if(!date)
      date = new Date()

    else if(['number', 'string'].includes(typeof date))
      date = new Date(date)
    
    if(!(date instanceof Date) && !date.year)
      throw new Error('Invalid date object')

    if(date instanceof Date){
      this.#date.year = date.getUTCFullYear()
      this.#date.month = date.getUTCMonth() + 1
      this.#date.date = date.getUTCDate()
      this.#date.hour = date.getHours()
      this.#date.minute = date.getUTCMinutes()
      this.#date.second = date.getUTCSeconds()
      this.#date.ms = date.getUTCMilliseconds()
    }
    else{
      const temp = new Date(0)

      this.#date.year = date.year ?? temp.getUTCFullYear()
      this.#date.month = date.month ?? temp.getUTCMonth() + 1
      this.#date.date = date.date ?? temp.getUTCDate()
      this.#date.hour = date.hour ?? temp.getUTCHours()
      this.#date.minute = date.minute ?? temp.getUTCMinutes() 
      this.#date.second = date.second ?? temp.getUTCSeconds()
      this.#date.ms = date.ms ?? temp.getUTCMilliseconds()
    }
  }

  /**
   * Get / Set the year
   * @param {number} value 
   * @returns {Temporal|number}
   */
  year(value){
    return Number.isInteger(value) ? (this.#date.year = value, this) : this.#date.year
  }

  /**
   * Get / Set the month
   * @param {number} value 
   * @returns {Temporal|number}
   */
  month(value){
    return Number.isInteger(value) ? (this.#date.month = value < 1 ? 1 : value > 12 ? 12 : value, this) : this.#date.month
  }

  /**
   * Get / Set the date
   * @param {number} value 
   * @returns {Temporal|number}
   */
  date(value){
    const max = Temporal.daysInMonth(this.month(), this.year())
    return Number.isInteger(value) ? (this.#date.date = value < 1 ? 1 : value > max ? max : value, this) : this.#date.date
  }

  /**
   * Get / Set the hour
   * @param {number} value 
   */
  hour(value){
    return Number.isInteger(value) ? (this.#date.hour = value % 24, this) : this.#date.hour
  }

  /**
   * Get / Set the minute
   * @param {number} value 
   */
  minute(value){
    return Number.isInteger(value) ? (this.#date.minute = value % 60, this) : this.#date.minute
  }

  /**
   * Get / Set the second
   * @param {number} value 
   */
  second(value){
    return Number.isInteger(value) ? (this.#date.second = value % 60, this) : this.#date.second
  }

  /**
   * Get / Set the milliseconds
   * @param {number} value 
   */
  ms(value){
    return Number.isInteger(value) ? (this.#date.ms = value % 1000, this) : this.#date.ms
  }

  /**
   * Gets the last date of the month
   * @returns {number}
   */
  lastDate(){
    return Temporal.daysInMonth(this.month(), this.year())
  }

  /**
   * Get the name of the month
   * @param {'long'|'short'} type
   */
  getMonth(type){
    const months =  [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ]

    return months[this.month() - 1].substring(0, type === 'short' ? 3 : months[this.month() - 1].length)
  }

  /**
   * Get the day of the week
   * @param {'long'|'short'|'numeric'} type
   */
  day(type){
    const date = new Date(),
    days = [
      'Sunday', 
      'Monday', 
      'Tuesday', 
      'Wednesday', 
      'Thursday', 
      'Friday', 
      'Saturday'
    ]
    date.setUTCFullYear(this.year(), this.month(), this.date())
    date.setUTCHours(this.hour(), this.minute(), this.second(), this.ms())

    if(type === 'numeric')
      return date.getDay()
    else
      return days[date.getDay()].substring(0, type === 'short' ? 3 : days[date.getDay()].length)
  }

  /**
   * Get the amount of millisecond elapsed since January 1, 1970
   * @returns {number}
   */
  timestamp(){
    const y = this.year() - 1970,
    leap = Math.round(y / 4),
    days = Array
    .from({length : this.month() - 1})
    .fill(0)
    .reduce((p,c,i)=>p+=Temporal.daysInMonth(i+1, this.year()), 0)

    return (y * 365 + leap + days + this.date() - this.leapYear() - 1) * 24 * 60 * 60 * 1000 + 
    this.hour() * 60 * 60 * 1000 + 
    this.minute() * 60 * 1000 + 
    this.second() * 1000 + 
    this.ms()
  }

  /**
   * Returns temporal as Date object
   */
  toDate(){
    const date = new Date()
    date.setUTCFullYear(this.year(), this.month(), this.date())
    date.setUTCHours(this.hour(), this.minute(), this.second(), this.ms())

    return date
  }

  /**
   * Check if the current year is leap year
   * @returns 
   */
  leapYear(){
    return Temporal.daysInMonth(2, this.year()) === 29
  }

  /**
   * Return the formatted date
   * 
   ** d - The day of the month (from 1 to 31)
   ** D - A textual representation of a day (three letters)
   ** l - A full textual representation of a day (Sunday to Saturday)
   ** w - A numeric representation of the day (0 for Sunday, 6 for Saturday)
   ** F - A full textual representation of a month (January through December)
   ** M - A short textual representation of a month
   ** m - A numeric representation of a month (1 to 12)
   ** t - The number of days in the given month
   ** L - Whether it's a leap year 
   ** Y - A four digit representation of a year
   ** y - A two digit representation of a year
   ** A - AM or PM 
   ** g - 12 hour format of an hour (1 to 12)
   ** G - 24 hour format of an hour (0 to 23)
   ** i - Minutes 
   ** s - Seconds
   */
  format(str){
    return str.replace(/d|D|l|w|F|M|m|t|L|Y|y|A|g|G|i|s/g, e=>{
      switch(e){
        case 'd' : return this.month()
        case 'D' : return this.day('short') 
        case 'l' : return this.day('long')
        case 'w' : return this.day('numeric')
        case 'F' : return this.getMonth('long')
        case 'M' : return this.getMonth('short')
        case 'm' : return this.month()
        case 't' : return Temporal.daysInMonth(this.month(), this.year())
        case 'L' : return this.leapYear() * 1
        case 'Y' : return this.year()
        case 'y' : return this.year().substring(-2)
        case 'A' : return this.hour() < 12 ? 'AM' : 'PM'
        case 'g' : return (this.hour() % 12 || 12).toString().padStart(2, 0)
        case 'G' : return this.hour()
        case 'i' : return this.minute().toString().padStart(2, 0)
        case 's' : return this.second().toString().padStart(2, 0)
      }
    })
  }

  /**
   * Get the total days in a month
   * @param {number} month 
   * @param {number} year 
   * @returns {number}
   */
  static daysInMonth(month, year){
    return month === 2 ? year & 3 || !(year % 25) && year & 15 ? 28 : 29 : 30 +(month +(month >> 3) & 1);
  }

  /**
   * Get the current date 
   * @returns {Temporal}
   */
  static now(){
    return new this(new Date())
  }
}
