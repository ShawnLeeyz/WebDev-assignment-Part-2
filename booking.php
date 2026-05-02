<?php
    /*
        Booking.php file for inserting data and innitializing database with user data from the booking form
        [Name: Shawn Lee]
        [id: 23204035]
    */
    require_once("../../files/settings.php"); /*Getting database information host, user, password, database name*/

    $conn = mysqli_connect($host, $user, $pswd, $dbnm); /*Atempt to connect to database*/
    if (!$conn) {//Check if unable to connect
        die("Connection failed: " . mysqli_connect_error());
    }

    /*SQL query for creating a table*/
    $create_table = "CREATE TABLE IF NOT EXISTS bookings (booking_id INT AUTO_INCREMENT PRIMARY KEY,
                                                          booking_number VARCHAR(20) UNIQUE NOT NULL,
                                                          customer_name VARCHAR(100) NOT NULL,
                                                          phone VARCHAR(12) NOT NULL,
                                                          unit_number VARCHAR(20),
                                                          street_number VARCHAR(20) NOT NULL,
                                                          street_name VARCHAR(100) NOT NULL,
                                                          pickup_suburb VARCHAR(100),
                                                          destination_suburb VARCHAR(100),
                                                          pickup_date VARCHAR(20) NOT NULL,
                                                          pickup_time VARCHAR(10) NOT NULL,
                                                          booking_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                          status VARCHAR(20) DEFAULT 'unassigned')";

    mysqli_query($conn, $create_table); //Creates the table


    $fields = ['cname', 'phone', 'unumber', 'snumber', 'stname', 'sbname', 'dsbname', 'date', 'time'];

    foreach($fields as $field){ //Goes through each string in fields
        if(isset($_POST[$field])){ //If field has a value
            $$field = mysqli_real_escape_string($conn, $_POST[$field]); //remove unwanted characters and assign it to the correct variable name
        }
        else{
            $$field = '';
        }
    }

    //This function returns a Booking number'BRR 00000...' for each booking
    function generateBookingNumber($conn) {


        $select = "SELECT MAX(booking_id) AS max FROM bookings"; //Selects the highest value of booking_id

        $result = mysqli_query($conn, $select);
        $row = mysqli_fetch_assoc($result); //Fetch the row that meets the query

        if ($row['max'] === NULL) {//Table is empty, this is the first booking
            $nextNum = 1;
        } 
        else {//Add 1 to the highest existing id
            $nextNum = $row['max'] + 1;
        }

        $digit = (string) $nextNum;
        while(strlen($digit)!= 5){ //This while loop is to have 5 digits for the booking number, so it loops and add 0 to the front until it reaches 5 digit in length
            $digit = '0' . $digit;
        }
        
        $booking_Number = 'BRN' . $digit;
        return $booking_Number;
    }

    $bookingNumber = generateBookingNumber($conn);

    //This query is too insert new booking details to the database
    $insert = "INSERT INTO bookings (booking_number, customer_name, phone, unit_number, street_number, street_name, 
                                    pickup_suburb, destination_suburb, pickup_date, pickup_time)
                VALUES ('$bookingNumber', '$cname', '$phone', '$unumber', '$snumber',
                        '$stname', '$sbname', '$dsbname', '$date', '$time')";
                          
    mysqli_query($conn, $insert);

    mysqli_close($conn); //Close connections with database

    echo json_encode([
        'success'       => true,
        'bookingNumber' => $bookingNumber,
        'pickupDate'    => $date,
        'pickupTime'    => $time
    ]);
?>