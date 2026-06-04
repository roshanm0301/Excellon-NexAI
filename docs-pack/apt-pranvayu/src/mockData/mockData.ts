import { v4 } from "uuid"; 

export const GetList = (key: string) => { 
    const item: any = localStorage.getItem(key); 
    const list: any[] = JSON.parse(item) || [] 
    return list; 
} 

export const Add = (key: string, data: any) => { 
    let list: any[] = GetList(key) || []; 
    if (list && data) { list.push({ id: v4(), ...data }) 
        localStorage.setItem(key, JSON.stringify(list)) 
    } 
} 

export const Update = (key: string, data: any) => { 
    let list: any[] = GetList(key) || []; 
    if (list && list?.length > 0 && data) { 
        list = list.map((item) => { 
            if (item.id === data.id) { 
                return { ...item, ...data } 
            } else 
                return item 
        }); 
        localStorage.setItem(key, JSON.stringify(list)) 
    } 
} 

export const Get = (key: string, data: any) => { 
    const list: any[] = GetList(key) || []; 
    if (list && list?.length > 0 && data) { 
        const item = list.find((i) => i.id === data) 
        return item 
    } 
} 

export const Remove = (key: string, data: any) => { 
    let list: any[] = GetList(key) || []; 
    if (list && list?.length > 0 && data) { 
        list = list.filter((item) => item.id !== data); 
        localStorage.setItem(key, JSON.stringify(list)) 
        return list
    } 
}