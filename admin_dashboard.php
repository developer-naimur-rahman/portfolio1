<?php
// Start the session at the beginning of the page
session_start();

// Check if the user is logged in as admin
if (!isset($_SESSION['user']) || $_SESSION['user'] !== 'admin') {
    // Access denied, stop the script and show an error message
    die("Access denied: You are not authorized to view this page.");
}

// Include database connection
include('db_connection.php');

// Retrieve all blog posts
$sql = "SELECT * FROM blog_posts ORDER BY created_at DESC";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
</head>
<body>
    <h1>Welcome, Admin</h1>

    <h2>Manage Blog Posts</h2>
    <a href="add_blog.php"><button>Add New Blog Post</button></a>

    <h3>All Blog Posts</h3>
    <table border="1">
        <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Actions</th>
        </tr>

        <?php while ($post = $result->fetch_assoc()): ?>
        <tr>
            <td><?php echo htmlspecialchars($post['title']); ?></td>
            <td><?php echo htmlspecialchars($post['category']); ?></td>
            <td>
                <a href="edit_blog.php?id=<?php echo $post['id']; ?>">Edit</a> |
                <a href="delete_blog.php?id=<?php echo $post['id']; ?>" onclick="return confirm('Are you sure you want to delete this post?')">Delete</a>
            </td>
        </tr>
        <?php endwhile; ?>

    </table>

</body>
</html>

<?php $conn->close(); ?>
