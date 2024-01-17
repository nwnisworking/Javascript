export default class Element{

elements = []

constructor(){

}

append(){}

prepend(){}

before(){}

after(){}

remove(){}

closest(){}

parentsUntil(){}

data(k, v = null){}

attr(k, v = null){}

text(v){}

html(v){}

static tag(name, attr = {}, ...children){
const tag = document.createElement(name)

for(let [k, v] of Object.entries(attr)
tag.setAttribute(k, v)


}

static query(selector){

}

static id(name){

}

static class(name){

}

static init(element){

}

}