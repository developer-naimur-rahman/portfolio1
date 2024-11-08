<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Blog Post</title>
</head>
<body>
    <h1>Upload New Blog Post</h1>
    <form method="POST" action="process_blog.php">
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required><br><br>

        <label for="content">Content:</label>
        <textarea id="content" name="content" required></textarea><br><br>

        <input type="submit" value="Upload Post">
    </form>
</body>
</html>
