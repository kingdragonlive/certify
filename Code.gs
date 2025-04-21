function doGet(e) {
  const htmlOutput = HtmlService.createTemplateFromFile('Index');
  
  // ใช้ URL จาก Google Drive ที่แชร์แล้ว หรือ URL ภาพอื่นๆ ที่เข้าถึงได้
  htmlOutput.logoUrl = 'https://drive.google.com/file/d/1ztD0CvCLUj2dczN-0j-FP1LPRGAj7ZiE/view?usp=sharing'; 
  
  return htmlOutput.evaluate()
    .setTitle('ระบบออกเลขเกียรติบัตร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function processForm(formData) {
  try {
    // ตรวจสอบข้อมูล
    if (!formData.name || !formData.department || !formData.activity) {
      throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    }
    
    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > 1000) {
      throw new Error('จำนวนที่ต้องการต้องเป็นตัวเลขระหว่าง 1-1000');
    }
    
    // ดึงข้อมูลจาก Google Sheets
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("2568") || 
                 spreadsheet.insertSheet("2568");
    
    // ใส่หัวข้อถ้าเป็นชีทใหม่
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["วันที่", "ชื่อ-สกุล", "หน่วยงาน", "กิจกรรม", "จำนวน", "เริ่มต้น", "สิ้นสุด"]);
    }
    
    // หาเลขล่าสุด
    const lastRow = sheet.getLastRow();
    let lastNumber = 0;
    
    if (lastRow > 1) {
      const numberRange = sheet.getRange(2, 6, lastRow - 1, 2).getValues();
      for (const row of numberRange) {
        const endNum = row[1];
        if (typeof endNum === 'number' && endNum > lastNumber) {
          lastNumber = endNum;
        }
      }
    }
    
    // คำนวณเลขใหม่
    const startNumber = lastNumber + 1;
    const endNumber = startNumber + quantity - 1;
    
    // บันทึกข้อมูล
    sheet.appendRow([
      Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy"),
      formData.name.trim(),
      formData.department.trim(),
      formData.activity.trim(),
      quantity,
      startNumber,
      endNumber
    ]);
    
    return { 
      success: true, 
      startNumber: startNumber,
      endNumber: endNumber 
    };
    
  } catch (error) {
    console.error('Error:', error);
    throw new Error('เกิดข้อผิดพลาดในการประมวลผล: ' + error.message);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function readData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    const data = sheet.getDataRange().getValues();
    Logger.log(data);
  } catch (e) {
    Logger.log("Error: " + e.toString());
    // ลองรันอีกครั้งหลังจากพัก 5 วินาที
    Utilities.sleep(5000);
    readData();
  }
}
