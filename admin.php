<?php
    $action = $_GET['action'];

    
    require_once("../../files/settings.php"); /*Getting database information host, user, password, database name*/

    
    $conn = mysqli_connect($host, $user, $pswd, $dbnm); /*Atempt to connect to database*/
    if (!$conn) {//Check if unable to connect
        die("Connection failed: " . mysqli_connect_error());
    }

    function SearchResult($action, $conn){
        if ($action == 'getBooking') { //handles searching with a reference
            $ref = $_GET['ref'];
            // query database for this ref number
            $selectQuery = "SELECT booking_number, customer_name, phone, pickup_suburb, destination_suburb, pickup_date, pickup_time, `status` 
            FROM bookings WHERE booking_number = '$ref'"; //Query for selecting the reference number with the appropriate attributes

            $result = mysqli_query($conn, $selectQuery); //Execute Select Query

            $data = mysqli_fetch_assoc($result);
            echo json_encode($data);
        } 
        else if ($action == 'getUpcoming') { //handles search without a reference
            // query database for bookings within 2 hours, only selecting non assigned bookings and check its within the current date
            $selectQuery = "SELECT booking_number, customer_name, phone, pickup_suburb, destination_suburb, pickup_date, pickup_time, `status` 
            FROM bookings WHERE pickup_time BETWEEN CURTIME() AND ADDTIME(CURTIME(), '02:00:00')
            AND STR_TO_DATE(pickup_date, '%d/%m/%Y') = CURDATE()
            AND `status` = 'unassigned'";


            $result = mysqli_query($conn, $selectQuery); //Execute Select Query
            $data = [];
            while($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }
            echo json_encode($data);
        }
    }

    //This function 
    function assigns($action, $conn){
        $ref = $_GET['ref'];
        //UpdateQuery for updating the status attribute
        $updateQuery = "UPDATE bookings SET `status` = 'assigned' WHERE booking_number = '$ref'"; 

        $result = mysqli_query($conn, $updateQuery);
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Booking ' . $ref . ' has been assigned']);
        } 
    }

    if($action == 'assignDriver') {
        assigns($action, $conn);
    } 
    else {
        SearchResult($action, $conn);
    }


?>