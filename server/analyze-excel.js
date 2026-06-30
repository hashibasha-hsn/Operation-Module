const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'أحياء_مدن_السعودية_العنوان_الوطني.xlsx');

try {
  const workbook = xlsx.readFile(excelPath);
  
  console.log('Excel File Analysis:');
  console.log('===================');
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('Number of Sheets:', workbook.SheetNames.length);
  console.log('');
  
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`Sheet ${index + 1}: ${sheetName}`);
    console.log('----------------');
    
    const sheet = workbook.Sheets[sheetName];
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    console.log('Range:', sheet['!ref']);
    console.log('Total Rows:', range.e.r + 1);
    console.log('Total Columns:', range.e.c + 1);
    
    // Get headers (first row)
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: range.s.r, c: col });
      const cell = sheet[cellAddress];
      headers.push(cell ? cell.v : '');
    }
    console.log('Headers:', headers);
    
    // Get first few rows of data
    console.log('Sample Data (first 3 rows):');
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`Row ${i + 1}:`, data[i]);
    }
    console.log('');
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  console.error('Error details:', error);
}
