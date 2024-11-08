<?php
// Database connection
$host = 'localhost';
$username = 'root'; // Use your MySQL username
$password = '';     // Use your MySQL password
$database = 'your_database_name'; // Replace with your database name

$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch latest blog posts (e.g., last 6 posts)
$sql = "SELECT title, DATE_FORMAT(date, '%M %d, %Y') as formatted_date, comments, description, link 
        FROM blogs 
        ORDER BY date DESC 
        LIMIT 6";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $blogs = [];
    while ($row = $result->fetch_assoc()) {
        $blogs[] = $row;
    }
    echo json_encode($blogs);
} else {
    echo json_encode([]);
}

$conn->close();
?>
