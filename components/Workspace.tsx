'use client'
import {useEffect,useMemo,useState} from 'react'
import {Plus,Search,PanelLeft,Sun,Moon,Trash2} from 'lucide-react'
import {loadPages,savePages,createPage,type Page} from '@/lib/storage'
import Editor from './Editor'

export default function Workspace({initialPageId}:{initialPageId?:string}={}){
 const [pages,setPages]=useState<Page[]>([]); const [active,setActive]=useState(''); const [sidebar,setSidebar]=useState(true); const [dark,setDark]=useState(false)
 useEffect(()=>{const p=loadPages();setPages(p);const hash=location.hash.slice(1);const requested=initialPageId||hash;setActive(requested&&p.some(x=>x.id===requested)?requested:(p[0]?.id||''))},[initialPageId])
 useEffect(()=>{if(pages.length)savePages(pages);document.documentElement.classList.toggle('dark',dark)},[pages,dark])
 const current=pages.find(p=>p.id===active); const top=useMemo(()=>pages.filter(p=>!p.parentId),[pages])
 const go=(id:string)=>{setActive(id);history.replaceState(null,'',id==='welcome'?'./':'./#'+id)}
 const add=(parentId:string|null=null)=>{const p=createPage(parentId);setPages(x=>[...x,p]);go(p.id)}
 const remove=()=>{if(!current||current.id==='welcome')return;setPages(x=>x.filter(p=>p.id!==current.id));go('welcome')}
 return <div className="flex min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
  {sidebar&&<aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 md:flex dark:border-zinc-800 dark:bg-zinc-900/50">
   <div className="flex items-center gap-2 p-3 text-sm font-semibold"><div className="grid size-7 place-items-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black">N</div>Nupoo</div>
   <div className="px-2"><button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800" onClick={()=>add()}><Plus size={16}/> Nová stránka</button></div>
   <div className="flex-1 overflow-auto p-2">{top.map(p=><button key={p.id} onClick={()=>go(p.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${active===p.id?'bg-zinc-200 dark:bg-zinc-800':'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}><span>{p.icon||'📄'}</span><span className="min-w-0 flex-1 truncate">{p.title||'Bez názvu'}</span></button>)}</div>
   <div className="border-t border-zinc-200 p-2 dark:border-zinc-800"><button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"><Search size={16}/> Hledat</button></div>
  </aside>}
  <main className="min-w-0 flex-1">
   <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-zinc-200 bg-white/90 px-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"><button className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={()=>setSidebar(x=>!x)}><PanelLeft size={17}/></button><div className="text-sm text-zinc-500">Nupoo</div><div className="flex-1"/><button onClick={()=>setDark(x=>!x)} className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900">{dark?<Sun size={17}/>:<Moon size={17}/>}</button>{current?.id!=='welcome'&&<button onClick={remove} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 size={17}/></button>}</header>
   {current?<Editor page={current} onChange={p=>setPages(x=>x.map(v=>v.id===p.id?p:v))}/>:<div className="p-12">Načítání…</div>}
  </main>
 </div>
}
