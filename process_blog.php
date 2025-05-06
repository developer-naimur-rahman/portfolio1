<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $errors = [];

    // Validate inputs
    $title = $_POST['title'] ?? '';
    $writer = $_POST['writer'] ?? '';
    $content = $_POST['content'] ?? '';
    $category = $_POST['category'] ?? '';
    $seo_title = $_POST['seo_title'] ?? '';
    $seo_description = $_POST['seo_description'] ?? '';

    // Check for missing required fields
    if (empty($title) || empty($writer) || empty($content) || empty($category) || empty($seo_title) || empty($seo_description)) {
        $errors[] = "All fields except photo are required.";
    }

    // Validate file upload
    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] != UPLOAD_ERR_OK) {
        $errors[] = "Photo upload failed or no photo uploaded.";
    }

    // If no errors, proceed to upload and save blog post
    if (empty($errors)) {
        $photoName = $_FILES['photo']['name'];
        $photoTmpName = $_FILES['photo']['tmp_name'];
        $uploadDir = 'uploads/';
        $photoPath = $uploadDir . basename($photoName);

        // Create upload directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Move the uploaded photo to the designated folder
        if (move_uploaded_file($photoTmpName, $photoPath)) {
            // Connect to the database
            $conn = new mysqli('localhost', 'root', '', 'blog_system');

            // Check connection
            if ($conn->connect_error) {
                die("Connection failed: " . $conn->connect_error);
            }

            // Generate a SEO-friendly link for the blog post
            $link = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title))) . ".html";

            // Insert data into the blog_posts table without the 'date' column
            $stmt = $conn->prepare("INSERT INTO blog_posts (title, writer, content, photo, category, link, seo_title, seo_description) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssssss", $title, $writer, $content, $photoPath, $category, $link, $seo_title, $seo_description);

            // Execute the query
            if ($stmt->execute()) {
                echo "Blog added successfully!";
            } else {
                echo "Error: " . $stmt->error;
            }

            // Close database connection
            $stmt->close();
            $conn->close();
        } else {
            echo "Error uploading photo.";
        }
    } else {
        // Output errors if any
        foreach ($errors as $error) {
            echo "<p class='error'>$error</p>";
        }
    }
} else {
    echo "Invalid request method.";
}
?>
