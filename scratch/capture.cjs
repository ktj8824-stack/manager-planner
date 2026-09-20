const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  
  const basePath = 'http://localhost:5000';
  
  // 1. Admin Dashboard
  const pageAdmin = await browser.newPage();
  await pageAdmin.setViewport({ width: 1440, height: 900 });
  await pageAdmin.goto(`${basePath}/admin.html`, { timeout: 0 }).catch(e => console.log('goto error ignored:', e));
  // Wait a bit for JS to render
  await new Promise(r => setTimeout(r, 2000));
  await pageAdmin.screenshot({ path: path.join(__dirname, '..', 'img', 'admin_dashboard.jpg'), quality: 90, type: 'jpeg' });
  
  // 2. Mobile Schedule (index.html or wherever the manager view is)
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844 }); // iPhone 13 Pro
  await pageMobile.goto(`${basePath}/index.html`, { timeout: 0 }).catch(e => console.log('goto error ignored:', e));
  await new Promise(r => setTimeout(r, 2000));
  await pageMobile.screenshot({ path: path.join(__dirname, '..', 'img', 'mobile_schedule.jpg'), quality: 90, type: 'jpeg' });

  // 3. We will reuse the admin dashboard for chat_integration but crop or just use another view if chat doesn't exist explicitly
  // Since chat briefing might be a modal, let's just click the button in admin.html and screenshot the modal.
  const pageChat = await browser.newPage();
  await pageChat.setViewport({ width: 1200, height: 800 });
  await pageChat.goto(`${basePath}/admin.html`, { timeout: 0 }).catch(e => console.log('goto error ignored:', e));
  await new Promise(r => setTimeout(r, 1000));
  
  // Open the send msg modal
  try {
    await pageChat.evaluate(() => {
      if(window.Admin && window.Admin.openSendMsgModal) {
        window.Admin.openSendMsgModal();
      }
    });
    await new Promise(r => setTimeout(r, 1000));
  } catch(e) {
    console.error(e);
  }
  
  await pageChat.screenshot({ path: path.join(__dirname, '..', 'img', 'chat_integration.jpg'), quality: 90, type: 'jpeg' });

  await browser.close();
  console.log('Screenshots captured successfully.');
})();
