import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const web='http://127.0.0.1:5199', api='http://127.0.0.1:5172', id='00000000-0000-4000-8000-000000000001', now='2026-10-21T01:00:00Z', image=api+'/test-image'
const user={id,name:'Admin',email:'admin@example.test',role:'master',emailVerified:true,image,firstName:null,lastName:null,phone:null,birthday:null,createdAt:now,updatedAt:now,banned:false}
const product={id,categoryId:null,brandId:id,name:'Laptop thật',slug:'laptop-that',summary:'Mô tả sản phẩm thật',imageUrl:image,status:'active',productType:'laptop',createdAt:now,updatedAt:now}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message))
let brokenAvatar=false, missingBrandLogo=false
const list=items=>({items,total:items.length,page:1,limit:50})
await page.route(api+'/**',async route=>{
 if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':web,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','access-control-allow-headers':'Accept,Content-Type,Authorization'}})
 const path=new URL(route.request().url()).pathname;let data=list([])
 if(path==='/auth/get-session')data={user,session:{id,userId:id,token:'fixture',createdAt:now,updatedAt:now,expiresAt:'2030-01-01T00:00:00Z'}}
 if(path==='/auth/providers')data={google:{enabled:false}}
 if(path==='/auth/admin/list-users')data={users:[{...user,image:brokenAvatar?api+'/broken-image':image}],total:1}
 if(path===`/admin/product-editor/${id}`)data={product:{...product,version:0},variants:[],media:[],content:[],balances:[]}
 if(path==='/admin/pickers/brands')data=list([{id,label:'Thương hiệu thật',logoUrl:missingBrandLogo?null:image}])
 if(path==='/admin/catalog/products')data=list([product])
 if(path==='/admin/catalog/brands')data=list([{id,name:'Thương hiệu thật',slug:'thuong-hieu-that',logoUrl:image,isActive:false,createdAt:now,updatedAt:now}])
 if(path==='/admin/catalog/categories')data=list([{id,parentId:null,name:'Danh mục thật',slug:'danh-muc',description:'Mô tả danh mục',imageUrl:image,isActive:true,position:0,createdAt:now,updatedAt:now}])
 if(path==='/admin/catalog/attributes')data=list([{id,name:'RAM',code:'ram',displayType:'text',isFilterable:true,position:0}])
 if(path==='/broken-image')return route.fulfill({status:404,headers:{'access-control-allow-origin':web},body:'Not found'})
 if(path==='/test-image')return route.fulfill({headers:{'access-control-allow-origin':web},contentType:'image/png',body:png})
 return route.fulfill({headers:{'access-control-allow-origin':web,'access-control-allow-credentials':'true'},contentType:'application/json',body:JSON.stringify(data)})
})
try {
 await mkdir('/tmp/admin-table-review',{recursive:true})
 for(const [resource,title,subtitle,status] of [['products','Laptop thật','laptop-that | Mô tả sản phẩm thật','Đang hoạt động'],['brands','Thương hiệu thật','thuong-hieu-that','Ngừng hoạt động'],['categories','Danh mục thật','Mô tả danh mục','Đang hoạt động'],['users','Admin','admin@example.test','Đang hoạt động'],['attributes','RAM','ram | text',null]]){
  await page.goto(web+'/admin/'+resource)
  const table=page.getByRole('table')
  await table.getByText(title,{exact:true}).waitFor()
  await table.getByText(subtitle,{exact:true}).waitFor()
  assert.equal(await table.locator('[data-slot="avatar"]').count(),resource==='products'?2:1)
  if(resource!=='attributes')await table.locator('img[data-slot="avatar-image"]').first().waitFor()
  assert.equal(await table.getByRole('columnheader',{name:/^(Ảnh đại diện|Đường dẫn hình ảnh|Logo|image|imageUrl|logoUrl|Đang hoạt động)$/i}).count(),0)
  assert.equal((await table.innerText()).includes(image),false)
  if(status){await table.getByRole('columnheader',{name:'Trạng thái',exact:true}).waitFor();assert.equal(await table.locator('[data-slot="badge"]').getByText(status,{exact:true}).count(),1)}
  if(resource==='attributes')assert.equal(await table.locator('[data-slot="avatar-fallback"]').innerText(),'RA')
  if(resource==='users'){
   brokenAvatar=true;await page.reload()
   await table.locator('[data-slot="avatar-fallback"]').getByText('AD',{exact:true}).waitFor()
  }
  await page.screenshot({path:`/tmp/admin-table-review/${resource}.png`})
  if(resource==='products'){
   const headings=await table.getByRole('columnheader').allTextContents();assert.match(headings[0],/Tên/);assert.match(headings[1],/Thương hiệu \/ Loại sản phẩm/);
   await table.getByText('Thương hiệu thật',{exact:true}).waitFor();await table.getByText('Laptop',{exact:true}).waitFor();
   const brandCell=table.locator('tbody tr').first().locator('td').nth(1);await brandCell.locator('[data-slot="avatar-image"]').waitFor();missingBrandLogo=true;await page.reload();await brandCell.locator('[data-slot="avatar-fallback"]').getByText('TH',{exact:true}).waitFor();assert.equal(await table.getByRole('columnheader',{name:'Danh mục',exact:true}).count(),0)
   await page.getByRole('button',{name:'Sửa Sản phẩm',exact:true}).click()
   await page.waitForURL(url=>url.pathname==='/admin/products/edit/'+id)
  }
 }
 assert.deepEqual(errors,[])
 console.log('PASS admin identity cells: product/category thumbnails, brand logo+slug, user avatar+email, attribute code/type, status badges and edit navigation')
}finally{await browser.close()}
