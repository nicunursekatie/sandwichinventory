/**
 * ENHANCED Google Apps Script - With Address Parsing
 * This version can handle addresses that are all entered in the street address field
 */

const SHEET_ID = '1p1j2vc7iEQdaQnGmOfRZ8UME89gLtCjOnapu0RvtK_M';
const SHEET_NAME = 'Responses';

function parseAddress(streetAddress, city, state, zip) {
  // If city, state, and zip are already filled, return as-is
  if (city && state && zip) {
    return {
      street: streetAddress || '',
      city: city,
      state: state,
      zip: zip
    };
  }
  
  // If everything is in streetAddress field, try to parse it
  if (streetAddress && !city && !state && !zip) {
    // Common patterns:
    // "123 Main St, Atlanta, GA 30303"
    // "123 Main St, Atlanta GA 30303"
    // "123 Main St Atlanta GA 30303"
    
    // Try to extract zip code first (5 digits at the end)
    const zipMatch = streetAddress.match(/\b(\d{5})(?:-\d{4})?\s*$/);
    let extractedZip = '';
    let remainingAddress = streetAddress;
    
    if (zipMatch) {
      extractedZip = zipMatch[1];
      remainingAddress = streetAddress.substring(0, zipMatch.index).trim();
    }
    
    // Try to extract state (2 capital letters near the end)
    const stateMatch = remainingAddress.match(/\b([A-Z]{2})\s*$/);
    let extractedState = '';
    
    if (stateMatch) {
      extractedState = stateMatch[1];
      remainingAddress = remainingAddress.substring(0, stateMatch.index).trim();
    }
    
    // Remove trailing comma if present
    remainingAddress = remainingAddress.replace(/,\s*$/, '');
    
    // Try to split by last comma to separate street from city
    const lastCommaIndex = remainingAddress.lastIndexOf(',');
    let extractedStreet = remainingAddress;
    let extractedCity = '';
    
    if (lastCommaIndex > -1) {
      extractedStreet = remainingAddress.substring(0, lastCommaIndex).trim();
      extractedCity = remainingAddress.substring(lastCommaIndex + 1).trim();
    } else {
      // No comma found, try to guess where city starts (last 1-3 words)
      const words = remainingAddress.split(' ');
      if (words.length > 3) {
        // Assume last 1-2 words are city
        const possibleCityWords = 2;
        extractedCity = words.slice(-possibleCityWords).join(' ');
        extractedStreet = words.slice(0, -possibleCityWords).join(' ');
      }
    }
    
    console.log(`Parsed address: Street="${extractedStreet}", City="${extractedCity}", State="${extractedState}", Zip="${extractedZip}"`);
    
    return {
      street: extractedStreet || streetAddress,
      city: extractedCity || '',
      state: extractedState || '',
      zip: extractedZip || ''
    };
  }
  
  // Default: return what we have
  return {
    street: streetAddress || '',
    city: city || '',
    state: state || '',
    zip: zip || ''
  };
}

function doPost(e) {
  try {
    console.log('Received POST request');
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data successfully, fields received:', Object.keys(data).length);
    console.log('Field names:', Object.keys(data).sort().join(', '));

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Check if headers need to be set
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setHeaders(sheet);
    } else if (sheet.getLastRow() === 0) {
      setHeaders(sheet);
    }

    // Parse address if needed
    const parsedAddress = parseAddress(
      data.streetAddress,
      data.city,
      data.state,
      data.zipCode
    );

    // Process array fields - handle both arrays and already-joined strings
    const contactMethods = Array.isArray(data.contactMethod)
      ? data.contactMethod.join(', ')
      : (data.contactMethod || '');

    const cannotServe = Array.isArray(data.cannotServeSandwich)
      ? data.cannotServeSandwich.join(', ')
      : (data.cannotServeSandwich || '');

    // Build row data with parsed address
    const rowData = [
      new Date().toISOString(),                    // 1. Timestamp
      data.orgName || '',                          // 2. Organization Name
      data.contactName || '',                      // 3. Primary Contact Name
      data.contactEmail || '',                     // 4. Email
      data.contactPhone || '',                     // 5. Phone Number
      parsedAddress.street,                        // 6. Street Address (parsed)
      data.addressLine2 || '',                     // 7. Address Line 2
      parsedAddress.city,                          // 8. City (parsed)
      parsedAddress.state,                         // 9. State (parsed)
      parsedAddress.zip,                           // 10. Zip Code (parsed)
      data.backupContactName || '',                // 11. Backup Contact Name
      data.backupContactEmail || '',               // 12. Backup Contact Email
      data.backupContactPhone || '',               // 13. Backup Contact Phone
      contactMethods,                              // 14. Preferred Contact Method
      data.website || '',                          // 15. Website
      data.socialMedia || '',                      // 16. Social Media Handle
      data.populationFocus || '',                  // 17. Population Focus
      data.serviceArea || '',                      // 18. Service Area
      data.feedingSchedule || '',                  // 19. Meal Days & Times
      data.donationSchedule || '',                 // 20. Donation Days & Times
      data.avgPeopleServed || '',                  // 21. Avg. # People Serve
      data.frequency || '',                        // 22. Frequency
      cannotServe,                                 // 23. Sandwiches Cannot Serve
      data.restrictionReason || '',                // 24. Cannot Serve Reason
      data.yearsReceivingSandwiches || '',         // 25. Years Receiving Sandwiches
      data.receivesFruitSnacks || '',              // 26. Receives fruit and snacks
      data.fruitSnacksInterest || '',              // 27. If no, would you like to?
      data.deliveryRating || '',                   // 28. Delivery Process Feedback
      data.deliveryFeedback || '',                 // 29. Delivery Feedback/Suggestions
      data.seasonalNeeds || '',                    // 30. Seasonal Needs (Yes/No)
      data.seasonalDetails || '',                  // 31. Seasonal Details
      '', // 32. How to Communicate Changes - NOT IN FORM
      data.orgReferrals || '',                     // 33. Recommended Partners
      data.grantInterest || '',                    // 34. Grant Interest
      data.impactStory || '',                      // 35. Impact Story
      data.impactPhotos || '',                     // 36. Photo Links
      data.additionalInfo || ''                    // 37. Additional Notes
    ];

    // Log what we're saving for debugging
    console.log('Address fields received:', {
      streetAddress: data.streetAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode
    });
    console.log('Address fields saved:', {
      street: parsedAddress.street,
      city: parsedAddress.city,
      state: parsedAddress.state,
      zip: parsedAddress.zip
    });

    console.log('Row data constructed with', rowData.length, 'fields');

    if (rowData.length !== 37) {
      console.error(`Data mismatch: Expected 37 fields, got ${rowData.length}`);
      throw new Error(`Data mismatch: Expected 37 fields, got ${rowData.length}`);
    }

    console.log('Attempting to append row to sheet...');
    sheet.appendRow(rowData);
    console.log('Row appended successfully!');

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Form submitted successfully' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing form submission:', error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Error: ' + error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function setHeaders(sheet) {
  const headers = [
    'Timestamp',
    'Organization Name',
    'Primary Contact Name',
    'Email',
    'Phone Number',
    'Street Address',
    'Address Line 2',
    'City',
    'State',
    'Zip Code',
    'Backup Contact Name',
    'Backup Contact Email',
    'Backup Contact Phone',
    'Preferred Contact Method',
    'Website',
    'Social Media Handle',
    'Population Focus',
    'Service Area',
    'Meal Days & Times',
    'Donation Days & Times',
    'Avg. # People Serve',
    'Frequency (Day/Week/Month)',
    'Sandwiches Cannot Serve',
    'Cannot Serve Reason',
    'Years Receiving Sandwiches',
    'Receives fruit and snacks',
    'If no, would you like to?',
    'Delivery Process Feedback',
    'Delivery Feedback/Suggestions',
    'Seasonal Needs (Yes/No)',
    'Seasonal Details',
    'How to Communicate Changes',
    'Recommended Partner Organizations',
    'Grant Interest',
    'Impact Story',
    'Photo Links',
    'Additional Notes'
  ];

  if (headers.length !== 37) {
    throw new Error(`Header mismatch: Expected 37 headers, got ${headers.length}`);
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#236383');
  headerRange.setFontColor('white');
  sheet.autoResizeColumns(1, headers.length);
}

function doGet() {
  return ContentService.createTextOutput('Recipient Survey Handler is running!');
}

// Test the address parser
function testAddressParser() {
  const testCases = [
    {
      street: '123 Main St, Atlanta, GA 30303',
      city: '', state: '', zip: ''
    },
    {
      street: '456 Oak Avenue, Suite 200, Decatur, GA 30030',
      city: '', state: '', zip: ''
    },
    {
      street: '789 Peachtree St NE Atlanta GA 30308',
      city: '', state: '', zip: ''
    },
    {
      street: '123 Main St',
      city: 'Atlanta', state: 'GA', zip: '30303'
    }
  ];
  
  console.log('Testing address parser:');
  testCases.forEach(test => {
    const result = parseAddress(test.street, test.city, test.state, test.zip);
    console.log(`Input: "${test.street}" | City: "${test.city}" | State: "${test.state}" | Zip: "${test.zip}"`);
    console.log(`Result: Street="${result.street}", City="${result.city}", State="${result.state}", Zip="${result.zip}"`);
    console.log('---');
  });
}