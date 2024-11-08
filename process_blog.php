<?php
include 'db_connection.php';  // Include the connection file

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $title = $_POST['title'];
    $content = $_POST['content'];

    // Prepare SQL statement to insert data into the blog_posts table
    $stmt = $conn->prepare("INSERT INTO blog_posts (title, content) VALUES (?, ?)");
    $stmt->bind_param("ss", $title, $content);

    if ($stmt->execute()) {
        echo "New blog post added successfully. <a href='single_blog.php?id=" . $stmt->insert_id . "'>View Post</a>";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>
