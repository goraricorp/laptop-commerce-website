import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const web='http://127.0.0.1:5199',api='http://127.0.0.1:5172',now=()=>new Date().toISOString()
const uid='00000000-0000-4000-8000-000000000031',gid='00000000-0000-4000-8000-000000000032',cid='00000000-0000-4000-8000-000000000033',oid='00000000-0000-4000-8000-000000000034'
let user=null,enabled=false,createdAt=now(),accounts=[],failUnlink=true,unlinks=0,reauths=0,links=[],searches=[],patches=0
const baseUser={id:uid,name:'Phase 3 browser',email:'phase3@example.test',role:'user',emailVerified:true}
const credential={id:cid,userId:uid,accountId:uid,providerId:'credential',createdAt:now(),updatedAt:now(),scopes:[]},google={...credential,id:gid,providerId:'google',accountId:'subject'}
const order=code=>({id:oid,code,userId:uid,guestEmail:null,subtotal:'1000',discountTotal:'0',shippingTotal:'0',grandTotal:'1000',orderStatus:'pending',paymentStatus:'unpaid',fulfillmentStatus:'unfulfilled',note:null,createdAt:now(),updatedAt:now(),itemCount:2})
const browser=await chromium.launch({headless:true}),page=await browser.newPage(),errors=[]
page.setDefaultTimeout(15000)
page.on('pageerror',error=>errors.push(error.message))
await page.route('https://accounts.google.com/**',route=>route.fulfill({contentType:'text/html',body:'<p>Mock Google authorization page</p>'}))
await page.route(`${api}/**`,async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method()
 const headers={'access-control-allow-origin':web,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','access-control-allow-headers':'Accept,Content-Type,Authorization'}
 if(method==='OPTIONS')return route.fulfill({status:204,headers})
 let data={items:[],total:0,page:1,limit:25},status=200
 if(path==='/auth/get-session')data=user?{user,session:{id:'fixture-session',userId:uid,token:'fixture',createdAt,updatedAt:createdAt,expiresAt:'2030-01-01T00:00:00Z'}}:null
 if(path==='/auth/providers')data={google:{enabled,reason:enabled?null:'not_configured'}}
 if(path==='/auth/list-accounts')data=accounts
 if(path==='/auth/sign-in/social'||path==='/auth/link-social'){const body=req.postDataJSON();links.push({path,body});assert.equal(body.provider,'google');assert.equal('idToken'in body,false);data={url:'https://accounts.google.com/o/oauth2/v2/auth?state=browser-fixture',redirect:true}}
 if(path==='/auth/sign-in/email'){assert.equal(req.postDataJSON().email,baseUser.email);reauths++;createdAt=now();data={user,token:'fixture',redirect:false}}
 if(path==='/auth/unlink-account'){unlinks++;assert.deepEqual(req.postDataJSON(),{accountId:gid});if(failUnlink){status=409;data={message:'Giữ phương thức đăng nhập cuối cùng',code:'FAILED_TO_UNLINK_LAST_ACCOUNT'}}else{accounts=[credential];data={status:true}}}
 if(path==='/catalog/search')data={items:[],total:0,page:1,limit:1,facets:{brands:[],categories:[],attributes:[]}}
 if(path==='/me/cart'||path==='/me/cart/merge')data=[]
 if(path==='/me/orders'||path==='/admin/orders'){
  const query=Object.fromEntries(url.searchParams);searches.push({path,...query});const next=Boolean(query.cursor),filtered=Boolean(query.q)||query.group==='completed';data={items:[order(filtered?'FILTERED':next?'HISTORY-PAGE-2':'HISTORY-PAGE-1')],total:filtered?1:225,limit:25,asOf:'2026-10-21T00:00:00.123456Z',hasMore:!next&&!filtered,nextCursor:next||filtered?null:'NEXT-CURSOR'}
 }
 if(path===`/order/sale/${oid}/status`&&method==='PATCH'){patches++;data={...order('HISTORY-PAGE-2'),orderStatus:req.postDataJSON().status}}
 return route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)})
})
try{
 await page.goto(`${web}/auth/sign-in?redirect=%2Fuser%2Forder`)
 await page.getByText('Đăng nhập Google chưa được cấu hình trên máy chủ.',{exact:true}).waitFor()
 enabled=true;await page.reload();await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();await page.waitForURL(url=>url.hostname==='accounts.google.com');assert.equal(links.at(-1).body.callbackURL,web+'/user/order')
 await page.goto(`${web}/auth/error?error=account_not_linked&error_description=UNTRUSTED`);await page.getByText(/Email này đã có tài khoản/).waitFor();assert.equal(await page.getByText('UNTRUSTED',{exact:true}).count(),0)
 console.log('PASS Google missing configuration, real redirect request and safe callback error UI')
 user={...baseUser};accounts=[credential,google];createdAt=new Date(Date.now()-601000).toISOString()
 await page.goto(`${web}/settings/connections`);await page.getByRole('button',{name:'Gỡ liên kết Google',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Gỡ liên kết Google',exact:true}).isDisabled(),true)
 await page.getByLabel('Mật khẩu xác minh lại',{exact:true}).fill('fixture-password-123');await page.getByRole('button',{name:'Xác minh lại',exact:true}).click();await page.getByText('Đã xác minh lại phiên đăng nhập',{exact:true}).waitFor();assert.equal(reauths,1)
 await page.getByRole('button',{name:'Gỡ liên kết Google',exact:true}).click();await page.getByText('Giữ phương thức đăng nhập cuối cùng',{exact:true}).waitFor();failUnlink=false;await page.getByRole('button',{name:'Gỡ liên kết Google',exact:true}).click();await page.getByRole('button',{name:'Liên kết Google',exact:true}).waitFor();assert.equal(unlinks,2)
 await page.getByRole('button',{name:'Liên kết Google',exact:true}).click();await page.waitForURL(url=>url.hostname==='accounts.google.com');assert.equal(links.at(-1).path,'/auth/link-social');assert.equal(links.at(-1).body.callbackURL,web+'/settings/connections')
 accounts=[google];await page.goto(`${web}/settings/connections`);await page.getByText(/Google là phương thức đăng nhập cuối cùng/).waitFor();assert.equal(await page.getByRole('button',{name:'Gỡ liên kết Google',exact:true}).isDisabled(),true)
 console.log('PASS connections reauthentication, error/success unlink, last-login protection and explicit linking redirect')
 await page.goto(`${web}/user/order`);await page.getByText('Đơn #HISTORY-PAGE-1',{exact:true}).waitFor();await page.getByRole('button',{name:'Trang sau',exact:true}).click();await page.getByText('Đơn #HISTORY-PAGE-2',{exact:true}).waitFor();assert.equal(searches.at(-1).cursor,'NEXT-CURSOR');assert.equal(searches.at(-1).asOf,'2026-10-21T00:00:00.123456Z')
 await page.getByRole('button',{name:'Trang trước',exact:true}).click();await page.getByText('Đơn #HISTORY-PAGE-1',{exact:true}).waitFor();await page.getByRole('textbox',{name:'Tìm đơn hàng',exact:true}).fill('needle');await page.getByRole('button',{name:'Tìm',exact:true}).click();await page.getByText('Đơn #FILTERED',{exact:true}).waitFor();assert.equal(searches.at(-1).cursor,undefined)
 console.log('PASS customer cursor pagination, stable snapshot, back navigation and search reset')
 user.role='master';await page.goto(`${web}/admin/orders`);await page.getByText('HISTORY-PAGE-1',{exact:true}).waitFor();await page.getByRole('navigation',{name:'Phân trang quản trị'}).getByRole('button',{name:'Trang sau',exact:true}).click();await page.getByText('HISTORY-PAGE-2',{exact:true}).waitFor();await page.getByRole('button',{name:'Chuyển trạng thái',exact:true}).click();await page.getByRole('button',{name:'Lưu',exact:true}).click();await page.getByText('HISTORY-PAGE-1',{exact:true}).waitFor();assert.equal(patches,1);assert.equal(searches.at(-1).cursor,undefined)
 assert.deepEqual(errors,[])
 console.log('PASS admin server pagination and reset/refresh after status mutation')
}finally{await browser.close()}
