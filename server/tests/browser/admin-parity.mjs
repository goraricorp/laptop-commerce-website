import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const web='http://127.0.0.1:5199', api='http://127.0.0.1:5172'
const id='00000000-0000-4000-8000-000000000001', mid='00000000-0000-4000-8000-000000000002', now='2026-10-21T01:00:00Z'
const user={id,name:'Actual admin',email:'admin-fixture@example.test',role:'master',emailVerified:true,username:'actualadmin',image:null,firstName:null,lastName:null,phone:null,birthday:null,createdAt:now,updatedAt:now}
const categoryId='00000000-0000-4000-8000-000000000021',brandId='00000000-0000-4000-8000-000000000022'
const product={id,categoryId,brandId,name:'Tên thật từ API',slug:'actual',summary:null,status:'active',productType:'laptop',createdAt:now,updatedAt:now}
let media={id:mid,productId:id,variantId:null,url:'https://example.test/old.webp',mediaType:'image',alt:'Ảnh thật',position:0,isPrimary:true,createdAt:now}
let qty=1, uploads=0, deletes=[], saves=[], creates=[], reviews=[], fail=false
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')
const browser=await chromium.launch({headless:true}), page=await browser.newPage(), errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.exposeFunction('reportUIError', message=>errors.push(message))
await page.addInitScript(()=>window.addEventListener('error',event=>{if(event.message)void window.reportUIError(event.message)}))
const cart=()=>[{id:mid,variantId:mid,productId:id,name:'Cart fixture',variantName:'Real SKU',price:200000,quantity:qty,selected:true}]
const list=items=>({items,page:1,limit:50,total:items.length})
await page.route(`${api}/**`,async route=>{
 const r=route.request(), u=new URL(r.url()), raw=u.pathname, p=raw.replace('/admin/catalog/products','/product').replace('/admin/catalog/product-media','/product/media'), method=r.method()
 const headers={'access-control-allow-origin':web,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PATCH,PUT,DELETE,OPTIONS','access-control-allow-headers':'Content-Type,Authorization'}
 if(method==='OPTIONS')return route.fulfill({status:204,headers})
 let data=list([]),status=200
 if(p==='/auth/get-session')data={user,session:{id,userId:id,token:'fixture',createdAt:now,updatedAt:now,expiresAt:'2030-01-01T00:00:00Z'}}
 if(p==='/auth/list-accounts')data=[{id,providerId:'credential',accountId:id}]
 if(p==='/auth/providers')data={google:{enabled:false}}
 if(p==='/auth/admin/get-user')data=user
 if(raw.startsWith('/admin/pickers/products'))data=list([{id,label:product.name}])
 if(raw==='/admin/pickers/categories')data=list([{id:categoryId,label:'Máy tính xách tay'}])
 if(raw==='/admin/pickers/brands')data=list([{id:brandId,label:'Thương hiệu thật'}])
 if(p==='/product')data=list([product])
 if(p===`/product/${id}`)data=product
 if(p===`/product/${id}/details`)data={product,brand:null,variants:[],media:[],contentSections:[]}
 if(p==='/catalog/search')data={items:[],total:0,page:1,limit:24,facets:{brands:[],categories:[],attributes:[]}}
 if(p==='/product/media'){data=list([media]);if(method==='POST'){const body=r.postDataJSON();creates.push(body);data={...media,...body,id:'00000000-0000-4000-8000-000000000003'};status=201}}
 if(p===`/product/media/${mid}`){data=media;if(method==='PATCH'){if(fail){status=409;data={message:'Lỗi lưu fixture'}}else{media={...media,...r.postDataJSON()};saves.push(media.url);data=media}}}
 if(p==='/storage/upload'){const key=`public/users/${id}/00000000-0000-4000-8000-${String(++uploads).padStart(12,'0')}.png`;data={path:key,url:`${api}/storage/object?key=${encodeURIComponent(key)}`,name:key.split('/').at(-1)};status=201}
 if(p==='/storage/object'){if(method==='DELETE'){deletes.push(r.postDataJSON().key);data={deleted:true}}else return route.fulfill({headers,body:png,contentType:'image/png'})}
 if(p==='/me/cart'||p==='/me/cart/merge')data=cart()
 if(p==='/me/cart/items/adjust'){await new Promise(resolve=>setTimeout(resolve,250));qty=Math.max(1,qty+r.postDataJSON().delta);data=cart()}
 if(p==='/review'&&method==='POST'){reviews.push(r.postDataJSON());status=201;data={id:mid}}
 if(p==='/review/summary')data={count:7,average:4.3}
 if(p==='/admin/statistics')data={revenue:200000,totalOrders:301,pendingOrders:2,totalUsers:1,totalProducts:1,totalBalances:0,lowStock:0,historyTotal:301,recentOrders:[{id,code:`ORDER-PAGE-${u.searchParams.get('page')||1}`,customerName:'Actual customer',customerEmail:'customer@example.test',grandTotal:'200000',orderStatus:'confirmed',paymentStatus:'paid',createdAt:now}]}
 if(p===`/admin/statistics/orders/${id}`)data={id,code:'DETAIL-FIXTURE',customerName:'Actual customer',subtotal:'200000',grandTotal:'200000',addresses:[],items:[],payments:[],shipments:[],history:[]}
 if(p==='/me/vouchers')data=[{id,code:'REAL-CODE',name:'Voucher từ API',discountType:'fixed',discountValue:'20000',minimumOrderValue:'100000',maximumDiscount:null,endsAt:'2030-01-01T00:00:00Z',state:'available'}]
 return route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)})
})
const upload=()=>page.locator('input[type="file"]').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:png})
try{
 await page.goto(`${web}/admin/products`);await page.getByText(product.name,{exact:true}).waitFor();assert.equal(await page.getByText(product.name,{exact:true}).count(),1)
 assert.equal(await page.getByRole('table').getByRole('columnheader',{name:'Danh mục',exact:true}).count(),0)
 await page.getByRole('table').getByText('Thương hiệu thật',{exact:true}).waitFor()
 assert.equal(await page.getByRole('columnheader',{name:/^id$/i}).count(),0)
 assert.equal(/00000000-0000-4000-8000-/.test(await page.getByRole('table').innerText()),false)
 await page.goto(`${web}/admin/users/edit/${id}`);await page.locator('input[name="name"]').waitFor();assert.equal(await page.locator('input[name="name"]').inputValue(),user.name)
 console.log('PASS actual admin rows and user edit')
 const editor=`${web}/admin/products/edit/${mid}?resource=product-media`
 await page.goto(editor);await page.getByRole('button',{name:'Upload ảnh',exact:true}).waitFor();assert.equal(await page.locator('input[name="url"]').getAttribute('type'),'hidden')
 await upload();await page.getByRole('button',{name:'Hủy ảnh mới'}).click();assert.equal(deletes.length,1)
 await upload();await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.waitForURL(`${web}/admin/products`);assert.equal(saves.length,1);assert.equal(deletes.length,1)
 await page.goto(editor);fail=true;await upload();await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.getByText('Lỗi lưu fixture',{exact:true}).first().waitFor();assert.equal(deletes.length,2)
 fail=false;await upload();await page.getByRole('button',{name:'Hủy',exact:true}).click();await page.waitForURL(`${web}/admin/products`);await page.waitForTimeout(200);assert.equal(deletes.length,3)
 await page.goto(`${web}/admin/products/create?resource=product-media`)
 await page.getByRole('combobox',{name:'Sản phẩm',exact:true}).click();await page.getByRole('option',{name:product.name,exact:true}).click();await upload();await page.getByRole('button',{name:'Tạo mới',exact:true}).click();await page.waitForURL(`${web}/admin/products`);assert.equal(creates.length,1);assert.match(creates[0].url,/storage\/object\?key=/);assert.equal(deletes.length,3)
 console.log('PASS hidden URL, upload preview, cancel, save, failed-save cleanup, leave-form cleanup')
 await page.goto(`${web}/cart`);const plus=page.getByRole('button',{name:'Tăng số lượng',exact:true});await plus.waitFor();await plus.click();await plus.click();await page.waitForTimeout(1000);assert.equal(qty,3)
 const minus=page.getByRole('button',{name:'Giảm số lượng',exact:true});await minus.click();await page.waitForTimeout(400);await minus.click();await page.waitForTimeout(400);assert.equal(qty,1);assert.equal(await minus.isDisabled(),true)
 await page.getByRole('button',{name:'Giỏ hàng, 1 sản phẩm',exact:true}).click();const drawer=page.getByRole('dialog');assert.equal(await drawer.getByRole('button',{name:'Giảm số lượng',exact:true}).isDisabled(),true);await drawer.getByRole('button',{name:'Tăng số lượng',exact:true}).click();await drawer.getByRole('button',{name:'Tăng số lượng',exact:true}).click();await page.waitForTimeout(1000);assert.equal(qty,3);await page.keyboard.press('Escape')
 console.log('PASS rapid quantity changes and boundary in cart and shadcn cart Sheet')
 await page.goto(`${web}/admin/statistics`);await page.getByText('ORDER-PAGE-1',{exact:true}).waitFor();await page.getByRole('button',{name:'Sau',exact:true}).click();await page.getByText('ORDER-PAGE-2',{exact:true}).waitFor();await page.getByRole('button',{name:'Xem đơn',exact:true}).click();await page.getByRole('dialog').getByText('Chi tiết đơn DETAIL-FIXTURE',{exact:true}).waitFor()
 await page.goto(`${web}/user/voucher`);await page.getByText('Voucher từ API · REAL-CODE',{exact:true}).waitFor();assert.deepEqual(errors,[])
 await page.goto(`${web}/product/laptop/brand/${id}`);await page.getByText('4.3 / 5 · 7 đánh giá',{exact:true}).waitFor();assert.deepEqual(errors,[])
 await page.getByRole('spinbutton',{name:'Điểm đánh giá (1–5)',exact:true}).fill('4');await page.getByRole('textbox',{name:'Trải nghiệm của bạn',exact:true}).fill('Nội dung đánh giá từ control shadcn');await page.getByRole('button',{name:'Gửi đánh giá',exact:true}).click();await page.getByText('Đã gửi đánh giá, đang chờ duyệt.',{exact:true}).waitFor();assert.equal(reviews.length,1);assert.equal(reviews[0].score,4);assert.equal(reviews[0].productId,id)
 console.log('PASS paginated history, order detail, real vouchers, review summary and review form submission')
}finally{await browser.close()}
