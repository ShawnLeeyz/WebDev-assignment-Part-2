/*
    Client-side JavaScript for the CabsOnline booking form
    [Name: Shawn Lee]
    [id: 23204035]
*/
// When page loads, runs the fillCurrentDateTime
window.onload = function() {
    fillCurrentDateTime();
};
//____________________________________________________________________________________________________
//function to fill in the textbox of the current time and date in the form
function fillCurrentDateTime() {
    var now = new Date(); //create a day object

    var day = now.getDate(); //Gets the current day
    var month = now.getMonth() + 1;  //Gets the current month +1 because it jan starts at 0
    var year = now.getFullYear();  //Gets the current year

    var hour = now.getHours(); //Gets the current hour
    var minute = now.getMinutes(); //Gets the current minute

    // Add leading zeros
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;

    var dateString = day + '/' + month + '/' + year;
    var timeString = hour + ':' + minute;

    //returns the date and time info the its respective input box
    document.getElementById('date').value = dateString;
    document.getElementById('time').value = timeString;
}

//____________________________________________________________________________________________________
//function to validate the date 
function isDateTimeValid(dateString, timeString) {
    // Split the date (DD/MM/YYYY)
    var parts = dateString.split('/');
    var day = parseInt(parts[0]);
    var month = parseInt(parts[1]) - 1;  // Month is 0-indexed in JavaScript
    var year = parseInt(parts[2]);
    
    // Split the time (HH:MM)
    var timeParts = timeString.split(':');
    var hour = parseInt(timeParts[0]);
    var minute = parseInt(timeParts[1]);
    
    // Create a Date object for the pickup time
    var pickupDateTime = new Date(year, month, day, hour, minute);
    
    // Get current date and time
    var now = new Date();
    
    // Compare: is pickup time in the future (or at least not in the past)?
    if (pickupDateTime < now) {
        return false;  // Pickup time is in the past - INVALID
    }
    
    return true;  // Pickup time is in the future - VALID
}

// Simple function to check if date is valid
function isDateFormatValid(dateString) {
    // Check if format looks like DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return false;  // Wrong format
    }
    
    // Split the date
    var parts = dateString.split('/');
    var day = parseInt(parts[0]);
    var month = parseInt(parts[1]) - 1;  // Months are 0-11 in JavaScript
    var year = parseInt(parts[2]);
    
    // Create a Date object
    var testDate = new Date(year, month, day);
    
    // Check if JavaScript changed the date (means it was invalid)
    // Example: Feb 30 becomes Mar 2, so the values won't match
    return testDate.getFullYear() === year && 
           testDate.getMonth() === month && 
           testDate.getDate() === day;
}

//____________________________________________________________________________________________________
//his is the event listener for the book button, when the button is clicked
document.getElementById('bookButton').addEventListener('click', function() {
    document.getElementById('reference').innerHTML = '';
    
    //Set all the values from the form to a variable
    const cname = document.getElementById('cname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const unumber = document.getElementById('unumber').value.trim();
    const snumber = document.getElementById('snumber').value.trim();
    const stname = document.getElementById('stname').value.trim();
    const sbname = document.getElementById('sbname').value.trim();
    const dsbname = document.getElementById('dsbname').value.trim();
    const date = document.getElementById('date').value.trim();
    const time = document.getElementById('time').value.trim();

    if(cname == '') { //Check if name is not empty
        alert('Please fill in your name');
        return;
    }
    if(phone == '') { //Check if phone number is not empty
        alert('Please fill in your phone number');
        return;
    }
    if(!/^\d{10,12}$/.test(phone)) { //Check if phone number is 10-12 digits
        alert('Phone number must be 10-12 digits');
        return;
    }
    if(snumber == '') { //Check if street number is not empty
        alert('Please fill in your street number');
        return;
    }
    if(stname == '') { //Check if street name is not empty
        alert('Please fill in your street name');
        return;
    }
    if(!isDateFormatValid(date)){ //Check if date is in the correct format and is a valid date
        alert('Please follow the date format DD/MM/YYYY');
        return;
    }
    if(!isDateTimeValid(date, time)){ //Check if the date and time is not in the past
        alert('Pickup date and time cannot be in the past');
        return;
    }
    
    //Call the submitBooking function to send the data to the server
    submitBooking(cname, phone, unumber, snumber, stname, sbname, dsbname, date, time);
});

//____________________________________________________________________________________________________
//submitBooking function is sends the data from the form to the php file and than gets the booking information from the database
async function submitBooking(cname, phone, unumber, snumber, stname, sbname, dsbname, date, time) {
    const formData = new FormData(); //Create an object that stores the form details of the user
    formData.append('cname', cname);
    formData.append('phone', phone);
    formData.append('unumber', unumber);
    formData.append('snumber', snumber);
    formData.append('stname', stname);
    formData.append('sbname', sbname);
    formData.append('dsbname', dsbname);
    formData.append('date', date);
    formData.append('time', time);
    
    try { //Sending the formData to the booking.php to be processed and wait
        const response = await fetch('booking.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json(); //convert the response from php to json
        
        if (data.success) {//If inserting data was succesful
            //Insert this html statement in the "reference" id that is in booking.html file
            document.getElementById('reference').innerHTML = 
                '<p>Thank you for your booking!</p>' +
                '<p>Booking reference number: ' + data.bookingNumber + '</p>' +
                '<p>Pickup time: ' + data.pickupTime + '</p>' +
                '<p>Pickup date: ' + data.pickupDate + '</p>';
        } else {
            alert('Error: ' + data.message);
        }
    } 
    catch (error) {
        alert('Server error: ' + error);
    }
}
