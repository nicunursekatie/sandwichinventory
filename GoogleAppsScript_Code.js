/**
 * Google Apps Script for Recipient Survey Form
 * 
 * Instructions:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete the default code and paste this entire script
 * 4. Save the project (give it a name like "Recipient Survey Handler")
 * 5. Deploy as web app:
 *    - Click Deploy > New Deployment
 *    - Choose "Web app" as type
 *    - Set Execute as: "Me"
 *    - Set Who has access: "Anyone"
 *    - Click Deploy
 * 6. Copy the web app URL and replace "YOUR_SCRIPT_ID" in the HTML form
 */

// Configuration - Update these with your actual Google Sheet ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your actual sheet ID
const SHEET_NAME = 'Responses'; // Name of the tab/sheet where responses will go

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Open the Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // If the sheet doesn't exist, create it with headers
    if (!sheet) {
      const newSheet = SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);
      setHeaders(newSheet);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: "Sheet created with headers"}));
    }
    
    // Prepare the row data in the correct order
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.orgName || '',
      data.contactName || '',
      data.contactEmail || '',
      data.contactPhone || '',
      data.orgAddress || '',
      data.backupContact || '',
      data.contactMethod || '',
      data.website || '',
      data.socialMedia || '',
      data.populationFocus || '',
      data.serviceArea || '',
      data.feedingDays || '',
      data.donationDays || '',
      data.estimatedPeople || '',
      data.currentSandwichSource || '',
      data.cannotServeReason || '',
      data.sandwichPreferences || '',
      data.dietaryRestrictions || '',
      data.allergyConcerns || '',
      data.additionalNotes || ''
    ];
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Form submitted successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error for debugging
    console.error('Error processing form submission:', error);
    
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Error processing form: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setHeaders(sheet) {
  // Set up the header row with all the form fields
  const headers = [
    'Timestamp',
    'Organization Name',
    'Contact Name',
    'Email',
    'Phone Number',
    'Organization Address',
    'Backup Contact',
    'Preferred Contact Method',
    'Website',
    'Social Media Handle',
    'Population Focus',
    'Service Area',
    'Feeding Days',
    'Donation Days',
    'Estimated People Served',
    'Current Sandwich Source',
    'Cannot Serve Reason',
    'Sandwich Preferences',
    'Dietary Restrictions',
    'Allergy Concerns',
    'Additional Notes'
  ];
  
  // Add headers to the first row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#236383');
  headerRange.setFontColor('white');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

function doGet(e) {
  // Handle GET requests (for testing)
  return ContentService.createTextOutput("Recipient Survey Form Handler is running!");
}

// Test function to create headers (run this once to set up your sheet)
function setupSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (sheet) {
    setHeaders(sheet);
    console.log("Headers set up successfully!");
  } else {
    console.log("Sheet not found. Please check your SHEET_ID and SHEET_NAME.");
  }
}
