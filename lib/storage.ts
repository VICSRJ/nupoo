export type Block={id:string;type:'paragraph'|'heading'|'bulletList'|'orderedList'|'taskList'|'blockquote'|'codeBlock';level?:1|2|3;text:string}
export type Page={id:string;title:string;icon?:string;favorite?:boolean;parentId?:string|null;blocks:Block[];updatedAt:string}
const KEY='nupoo.pages.v1'
const seed:Page={id:'welcome',title:'Vítejte v Nupoo',icon:'✦',parentId:null,updatedAt:new Date().toISOString(),blocks:[{id:'b1',type:'heading',level:1,text:'Nupoo'},{id:'b2',type:'paragraph',text:'Notion-like blokový editor. Začni psát.'},{id:'b3',type:'paragraph',text:'Použij + pro nový blok a úchyt pro přesunutí.'}]}
export function loadPages():Page[]{if(typeof window==='undefined')return[seed];try{const raw=localStorage.getItem(KEY);if(!raw){localStorage.setItem(KEY,JSON.stringify([seed]));return[seed]}return JSON.parse(raw) as Page[]}catch{return[seed]}}
export function savePages(pages:Page[]){localStorage.setItem(KEY,JSON.stringify(pages))}
export function createPage(parentId:string|null=null):Page{return{id:crypto.randomUUID(),title:'Nová stránka',icon:'📄',parentId,updatedAt:new Date().toISOString(),blocks:[{id:crypto.randomUUID(),type:'paragraph',text:''}]}}
