<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Single Blog Post</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            width: 80%;
            margin: 20px auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
            border-radius: 8px;
        }

        h1 {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }

        p {
            line-height: 1.6;
            font-size: 1.1em;
            color: #555;
            margin: 10px 0;
        }

        small {
            display: block;
            font-size: 0.9em;
            color: #888;
            margin-top: 20px;
        }

        .error {
            color: red;
            font-weight: bold;
        }

        a {
            text-decoration: none;
            color: #007BFF;
        }

        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
<div class="container">
<?php 
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "blog_system";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get ID parameter from URL
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// If ID is invalid, show an error
if ($id == 0) {
    echo "<p class='error'>Invalid post ID.</p>";
    exit;
}

// SQL query for a specific blog post
$stmt = $conn->prepare("SELECT * FROM blog_posts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

// If post found, display it
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "<h1>" . htmlspecialchars($row['title']) . "</h1>";
    echo "<p>" . nl2br(htmlspecialchars($row['content'])) . "</p>";
    echo "<small>Written by " . htmlspecialchars($row['writer']) . "</small>";
} else {
    echo "<p class='error'>Post not found.</p>";
}

// Close connection
$stmt->close();
$conn->close();
?>
</div>
</body>
</html>
