customElements.define('sortable-list', class extends HTMLElement{
  placeholder = document.createElement('div')

  connectedCallback(){
    this.placeholder.innerHTML = '&nbsp;'
    this.placeholder.setAttribute('name', 'placeholder')
    this.style.display = 'block'

    for(let c of this.children)
      c.addEventListener('mousedown', this.mousedown.bind(c, this))
  }

  mousedown(p, ev){
    p.placeholder.style.width = CSS.px(this.offsetWidth)
    p.placeholder.style.height = CSS.px(this.offsetHeight)
    this.style.position = 'absolute'
    this.style.left = CSS.px(this.offsetLeft)
    this.style.top = CSS.px(this.offsetTop)

    this.before(p.placeholder)
    this.setAttribute('x', ev.pageX)
    this.setAttribute('y', ev.pageY)
    this.setAttribute('selected', true)

    let move
    window.addEventListener('mousemove', move = p.mousemove.bind(this, p))
    window.addEventListener('mouseup', ()=>{
      p.placeholder.before(this)
      p.placeholder.remove()
      this.removeAttribute('x')
      this.removeAttribute('y')
      this.removeAttribute('selected')
      this.removeAttribute('style')
      window.removeEventListener('mousemove', move)
    }, {once : true})
  }

  mousemove(p, ev){
    ev.preventDefault()
    const x = this.getAttribute('x') - ev.pageX
    const y = this.getAttribute('y') - ev.pageY
    const t = !p.getAttribute('dir') || p.getAttribute('dir') === 'vertical' ? 'offsetHeight' : 'offsetWidth'
    const d = !p.getAttribute('dir') || p.getAttribute('dir') === 'vertical' ? 'offsetTop' : 'offsetLeft' 
    const c = [...p.children]
    this.setAttribute('x', ev.pageX)
    this.setAttribute('y', ev.pageY)
    
    this.style.left = CSS.px(this.offsetLeft - x)
    this.style.top = CSS.px(this.offsetTop - y)

    let m = c.find(e=>
      e !== this && 
      this[d] + e[t] / 2 > e[d] && 
      this[d] < e[d] + e[t] / 2
    )

    if(m)
      if(c.indexOf(m) <= c.indexOf(p.placeholder))
        m.before(p.placeholder)
      else
        m.after(p.placeholder)
  }
})
