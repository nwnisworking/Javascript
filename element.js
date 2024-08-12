/**
 * @typedef {UIEvent | AnimationEvent | Event | DragEvent | CompositionEvent | MouseEvent | InputEvent | FocusEvent | ClipboardEvent | PointerEvent | SubmitEvent | ErrorEvent | FormDataEvent | KeyboardEvent | ProgressEvent | SecurityPolicyViolationEvent | TouchEvent | TransitionEvent | WheelEvent} ElementEvent
 */

/**
 * 
 * @param {keyof HTMLElementTagNameMap|HTMLElement} name 
 * @param {?string} text 
 */
export default function element(name, text){
  return new $(name, text)
}

export class Component extends HTMLElement{
  /** @type {$} */
  $

  connectedCallback(data){}
}

class ${
  /** @type {HTMLElement} */
  #element

  /** @type {Record<keyof HTMLElementEventMap, Array<Array<(this: $, ev: ElementEvent)=>any>>>} */
  #events = {}

  /** @type {object} */
  #state = {}

  constructor(name, text){
    if(name instanceof HTMLElement){
      this.#element = name

      if(text)
        this.#element.textContent = text
    }
    else if(name === '#text'){
      this.#element = document.createTextNode(text)
    }
    else{
      this.#element = document.createElement(name)
      this.#element.textContent = text ?? ''
    }

    this.#element.$ = this
  }

  /**
   * 
   * @param {string} key 
   * @param {string|number} value 
   */
  attr(key, value = null){
    if(value === null)
      return this.#element.getAttribute(key)

    this.#element.setAttribute(key, value)
    return this
  }

  /**
   * 
   * @param {string} key 
   */
  removeAttr(key){
    this.#element.removeAttr(key)
    return this
  }

  /**
   * 
   * @param {keyof HTMLElementEventMap} type 
   * @param {(this: $, ev: ElementEvent)=>any} cb 
   * @param {boolean|AddEventListenerOptions} option 
   */
  event(type, cb, option){
    const self = this,
    _ = ev=>(ev.$ = ev.target.$, cb.call(self, ev))

    if(!this.#events[type])
      this.#events[type] = []

    this.#events[type].push([cb, _])
    this.#element.addEventListener(type, _, option)

    return this
  }

  /**
   * 
   * @param {keyof HTMLElementEventMap} type 
   * @param {?(this: $, ev:ElementEvent)=>any} cb 
   * @param {boolean|EventListenerOptions} option
   */
  removeEvent(type, cb, option){
    const event = this.#events[type] ?? []

    for(let i = 0; i < event.length; i++){
      let decrement = cb ? event[i].includes(cb) : true

      if(!decrement) continue

      this.#element.removeEventListener(type, event[i][1], option)
      event.splice(i, 1)
      i--

      if(cb) break
    }

    return this
  }

  removeChildren(){
    while(this.#element.childElementCount)
      this.#element.lastElementChild.remove()

    return this
  }

  /**
   * 
   * @param {CustomEvent|Event} event 
   */
  dispatchEvent(event){
    this.#element.dispatchEvent(event)

    return this
  }

  /**
   * 
   * @param  {...$} $ 
   */
  append(...$){
    this.#element.append(...$.map(e=>e.toNode()))
  }

  /**
   * 
   * @param  {...$} $ 
   */
  prepend(...$){
    this.#element.prepend(...$.map(e=>e.toNode()))
  }

  /**
   * 
   * @param  {...$} $ 
   */
  before(...$){
    this.#element.before(...$.map(e=>e.toNode()))
  }

  /**
   * 
   * @param  {...$} $ 
   */
  after(...$){
    this.#element.after(...$.map(e=>e.toNode()))
  }

  remove(){
    this.#element.remove()
  }

  value(value){
    return this.#kv(value, 'value')
  }

  text(value){
    return this.#kv(value, 'textContent')
  }

  html(value){
    return this.#kv(value, 'innerHTML')
  }

  data(key, value){
    if(value === undefined)
      return this.#element.dataset[key]

    this.#element.dataset[key] = value
    
    return this
  }

  state(key, value){
    if(value === undefined)
      return this.#state[key]
    
    this.#state[key] = value

    return this
  }

  $(query){
    const _ = this.#element.querySelector(query)

    if(!_) return null

    return _.$ || element(_)
  }

  $$(query){
    const _ = this.#element.querySelectorAll(query)

    if(!_.length) return null

    return [..._].map(e=>e.$ || element(e))
  }

  render(data){
    if(this.#element.connectedCallback)
      this.#element.connectedCallback(data)

    return this
  }

  toNode(){
    return this.#element
  }

  #kv(value, getter, setter){
    setter??= getter

    if(value === undefined)
      return this.#element[getter]

    this.#element[setter] = value

    return this
  }
}
