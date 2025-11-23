<?php
// ডাটাবেস সংযোগ সেটিংস
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "blog_system";

// সংযোগ তৈরি করা
$conn = new mysqli($servername, $username, $password, $dbname);

// সংযোগ পরীক্ষা করা
if ($conn->connect_error) {
    die("সংযোগ ব্যর্থ: " . $conn->connect_error);
}

// ব্লগ পোস্ট আইডি গ্রহন করা
$post_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// পোস্টের বিস্তারিত তথ্য পেতে SQL কুয়েরি
$sql = "SELECT * FROM blog_posts WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $post_id);
$stmt->execute();
$result = $stmt->get_result();

// পোস্ট পাওয়া গেলে
if ($result->num_rows > 0) {
    $post = $result->fetch_assoc();
} else {
    echo "<p>এই পোস্টটি পাওয়া যায়নি।</p>";
    exit;
}

// Assuming the writer is logged in (for editing permission)
session_start();
$logged_in_user = $_SESSION['user'] ?? null;

// Check if the logged-in user is the author or admin
if ($logged_in_user && ($logged_in_user === $post['writer'] || $logged_in_user === 'admin')) {
    // Process the form submission to update the post
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $title = $_POST['title'];
        $content = $_POST['content'];
        $category = $_POST['category'];
        $photo = $_POST['photo'];  // handle photo upload as needed

        // SQL to update the blog post
        $update_sql = "UPDATE blog_posts SET title = ?, content = ?, category = ?, photo = ? WHERE id = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("ssssi", $title, $content, $category, $photo, $post_id);

        if ($update_stmt->execute()) {
            echo "<p>পোস্টটি সফলভাবে আপডেট করা হয়েছে।</p>";
        } else {
            echo "<p>এটি আপডেট করতে সমস্যা হয়েছে।</p>";
        }
    }
} else {
    echo "<p>আপনার কাছে এই পোস্টটি সম্পাদনা করার অনুমতি নেই।</p>";
    exit;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Post - <?php echo htmlspecialchars($post['title']); ?></title>
    <link rel="stylesheet" href="css/style-blog.css">
</head>
<body>
    <!-- Header Section -->
    <header class="header">
        <div class="header__logo">
            <a href="./blog.php">
                <img src="img/motion of naimur -Website Header logo 250-100.png" alt="Logo of Naimur Rahman Emon">
            </a>
        </div>
        <nav class="header__nav__menu">
            <ul>
                <li><a href="./index.html">Home</a></li>
                <li><a href="./about.html">About</a></li>
                <li><a href="./portfolio.html">Work</a></li>
                <li><a href="./services.html">Services</a></li>
                <li><a href="./blog.php" class="active">Blog</a></li>
                <li><a href="./contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- Edit Post Form -->
    <div class="edit-post-container">
        <h1>Edit Post</h1>
        <form method="POST" action="edit_blog.php?id=<?php echo $post['id']; ?>">
            <label for="title">Title:</label>
            <input type="text" id="title" name="title" value="<?php echo htmlspecialchars($post['title']); ?>" required>

            <label for="content">Content:</label>
            <textarea id="content" name="content" rows="6" required><?php echo htmlspecialchars($post['content']); ?></textarea>

            <label for="category">Category:</label>
            <input type="text" id="category" name="category" value="<?php echo htmlspecialchars($post['category']); ?>" required>

            <label for="photo">Post Image (URL):</label>
            <input type="text" id="photo" name="photo" value="<?php echo htmlspecialchars($post['photo']); ?>">

            <button type="submit">Update Post</button>
        </form>
    </div>

    <!-- Footer Section -->
    <footer class="footer">
        <p>&copy; <?php echo date("Y"); ?> Naimur Rahman Emon. All Rights Reserved.</p>
    </footer>
</body>
</html>

<?php
// ডাটাবেস সংযোগ বন্ধ করা
$conn->close();
?>
