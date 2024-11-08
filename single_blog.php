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
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($post['title']); ?></title>
    <link rel="stylesheet" href="css/style-blog.css"> <!-- External CSS Link -->
</head>
<body>
    <!-- Header Section with Navigation -->
    <header class="header">
        <div class="header__logo">
            <a href="./index.php">
                <img src="img/logo.png" alt="Logo of Naimur Rahman Emon">
            </a>
        </div>
        <nav class="header__nav__menu">
            <ul>
                <li><a href="./index.html">Home</a></li>
                <li><a href="./about.html">About</a></li>
                <li><a href="./portfolio.html">Portfolio</a></li>
                <li><a href="./services.html">Services</a></li>
                <li><a href="./index.php" class="active">Blog</a></li>
                <li><a href="./contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- Single Post Content Section -->
    <div class="single-post-container">
        <h1><?php echo htmlspecialchars($post['title']); ?></h1>
        <p><strong>Writer:</strong> <?php echo htmlspecialchars($post['writer']); ?></p>
        <p><strong>Category:</strong> <?php echo htmlspecialchars($post['category']); ?></p>
        <div class="post-image">
            <?php if ($post['photo']) { ?>
                <img src="<?php echo htmlspecialchars($post['photo']); ?>" alt="Post Image">
            <?php } ?>
        </div>
        <div class="post-content">
            <p><?php echo nl2br(htmlspecialchars($post['content'])); ?></p>
        </div>
        
        <!-- Edit Button (Only for the writer or admin) -->
        <?php if ($logged_in_user && ($logged_in_user === $post['writer'] || $logged_in_user === 'admin')): ?>
            <a href="edit_blog.php?id=<?php echo $post['id']; ?>" class="edit-button">Edit Post</a>
        <?php endif; ?>
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
