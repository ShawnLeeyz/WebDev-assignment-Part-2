/*
    javascript file for deadling with the admin page, such as searching for a booking, gets its from the php file and displaying all the bookings
    [Name: Shawn Lee]
    [id: 23204035]
*/

//When the search button is clicked, it will send a request to the server to get the booking details based on the search term.
document.getElementById('sbutton').addEventListener('click', function() {
    var searchTerm = document.getElementById('bsearch').value.trim();
    var contentDiv = document.querySelector('.content');

    var pattern = /^BRN\d{5}$/;
    if(searchTerm !== ''){
        if (!pattern.test(searchTerm)) { //If the search term does not match the expected format
            contentDiv.innerHTML = '<p style="color:red;">Error: Invalid reference number format. (BRN-YYYYMMDD-NNN)</p>';
        }
        else{ //If the search term is valid, send the request to the server
            sendRequest(searchTerm);
        }
    }
    else{ //If the search term is empty, send the request to get all the upcoming bookings
        sendRequest(null);
    }

});

//This function sends a request to the server to get the booking details based on the search term
async function sendRequest(searchTerm) {
    var contentDiv = document.querySelector('.content');

    if (searchTerm !== null) { //If search term is not null, than the respose is fetched and than call the display function
        const response = await fetch('admin.php?action=getBooking&ref=' + searchTerm);
        const data = await response.json();
        displayBookingDetails(data, contentDiv);
    } 
    
    else { //If the search term is null, than just get all the booking details that meet a certain criteria and call the display function
        const response = await fetch('admin.php?action=getUpcoming');
        const data = await response.json();
        displayBookingDetails(data, contentDiv);
    }
}

//This is the function that display the booking details, by creating a table
function displayBookingDetails(data, contentDiv) {
    // make sure data is always an array
    if (!Array.isArray(data)) {
        data = [data];
    }

    let table = `<table>
            <tr>
                <th>Booking Reference</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Pickup Suburb</th>
                <th>Destination Suburb</th>
                <th>Pickup Date</th>
                <th>Pickup Time</th>
                <th>Status</th>
                <th>Assign</th>
            </tr>`;

    // Loop through the data and create a table row for each booking
    data.forEach(row => {
        table += `
            <tr>
                <td>${row.booking_number}</td>
                <td>${row.customer_name}</td>
                <td>${row.phone}</td>
                <td>${row.pickup_suburb}</td>
                <td>${row.destination_suburb}</td>
                <td>${row.pickup_date}</td>
                <td>${row.pickup_time}</td>
                <td id="status-${row.booking_number}">${row.status}</td>
                <td><input type="button" name="Assign" id="assign" value="Assign" onclick="assignDriver('${row.booking_number}')"></td>
            </tr>
        `;
    });

    table += '</table>';
    contentDiv.innerHTML = table;
}

//This function is called when the assign button is activated, sends request to the server and assigns a driver to the booking and update status
async function assignDriver(bookingNumber) {
    const response = await fetch('admin.php?action=assignDriver&ref=' + bookingNumber);
    const data = await response.json();
    
    if (data.success) { //If request is succesful, update the status to "Assigned" and display confirmation message
        document.getElementById('status-' + bookingNumber).textContent = 'Assigned';
        // Insert confirmation message into the page
        document.querySelector('.confirm').innerHTML = `
            <p style="background-color:green;">${data.message}</p>`;
        
    } 
    else { //If the request fails, display an error message
        document.querySelector('.confirm').innerHTML += '<p style="color:red;">Failed to assign driver for booking ' + bookingNumber + '</p>';
    }
}