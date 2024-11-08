<?php
// ডাটাবেস সংযোগ সেটিংস
$servername = "localhost";
$username = "root";  // XAMPP এ MySQL এর ডিফল্ট ইউজারনেম
$password = "";      // XAMPP এ MySQL এর ডিফল্ট পাসওয়ার্ড (ডিফল্টভাবে খালি)
$dbname = "blog_system";  // আপনার ডাটাবেসের নাম

// সংযোগ তৈরি করা
$conn = new mysqli($servername, $username, $password, $dbname);

// সংযোগ পরীক্ষা করা
if ($conn->connect_error) {
    die("সংযোগ ব্যর্থ: " . $conn->connect_error);
}

// ব্যবহারকারীর কাছ থেকে অনুসন্ধানের কুয়েরি (যদি থাকে) নেওয়া
$search_query = isset($_GET['search']) ? $_GET['search'] : '';

// প্রতিটি পেজে পোস্টের সংখ্যা নির্ধারণ করা
$posts_per_page = 5;

// বর্তমান পেজ পেতে (ডিফল্ট পেজ 1)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $posts_per_page;

// ব্লগ পোস্টের তথ্য অনুসন্ধান করার SQL কুয়েরি, অনুসন্ধান ফিল্টার (যদি থাকে) সহ
$sql = "SELECT * FROM blog_posts WHERE title LIKE ? OR content LIKE ? LIMIT ?, ?";
$stmt = $conn->prepare($sql);
$search_param = "%$search_query%";
$stmt->bind_param("ssii", $search_param, $search_param, $offset, $posts_per_page);
$stmt->execute();
$result = $stmt->get_result();

// পেজিনেশন এর জন্য মোট পোস্টের সংখ্যা পাওয়া
$total_posts_sql = "SELECT COUNT(*) FROM blog_posts WHERE title LIKE ? OR content LIKE ?";
$total_posts_stmt = $conn->prepare($total_posts_sql);
$total_posts_stmt->bind_param("ss", $search_param, $search_param);
$total_posts_stmt->execute();
$total_posts_stmt->bind_result($total_posts);
$total_posts_stmt->fetch();
$total_pages = ceil($total_posts / $posts_per_page);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Posts</title>
    <link rel="stylesheet" href="css/style-blog.css">
</head>

<body>

    <!-- পেজ হেডার -->
    <header class="header">
        <div class="header__logo">
            <a href="/blog.php">
                <img src="img/logo.png" alt="Logo of Naimur Rahman Emon">
            </a>
        </div>
        <nav class="header__nav__menu">
            <ul>
                <li><a href="./index.html">Home</a></li>
                <li><a href="./about.html">About</a></li>
                <li><a href="./portfolio.html">Portfolio</a></li>
                <li><a href="./services.html">Services</a></li>
                <li><a href="./blog.php" class="active">Blog</a></li>
                <li><a href="./contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- ব্লগ কনটেন্ট -->
    <h1>Blog Posts</h1>

    <!-- অনুসন্ধান ফর্ম -->
    <form action="" method="get">
        <input type="text" name="search" placeholder="Search posts..." value="<?php echo htmlspecialchars($search_query); ?>" style="width: 300px; padding: 10px;">
        <button type="submit" style="padding: 10px; background-color: #007bff; color: white; border: none;">Search</button>
    </form>

    <?php
    // পোস্ট থাকলে সেগুলি প্রদর্শন করা
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo "<div class='post'>";
            echo "<div class='post-content'>";
            echo "<h2><a href='single_blog.php?id=" . $row["id"] . "'>" . htmlspecialchars($row["title"]) . "</a></h2>";  // শিরোনাম লিঙ্ক
            echo "<p><strong>Writer:</strong> " . htmlspecialchars($row["writer"]) . "</p>";  // লেখক
            echo "<p><strong>Category:</strong> " . htmlspecialchars($row["category"]) . "</p>";  // ক্যাটাগরি
            echo "<p>" . nl2br(htmlspecialchars($row["content"])) . "</p>";  // পোস্টের বিষয়বস্তু
            echo "</div>";  // পোস্ট কনটেন্ট শেষ
            if ($row["photo"]) {
                echo "<div class='post-image'><img src='" . htmlspecialchars($row["photo"]) . "' alt='Post Image'></div>";  // পোস্টের ছবি
            }
            echo "</div>";  // পোস্ট শেষ
        }
    } else {
        echo "<p>No posts found.</p>";  // কোনো পোস্ট না থাকলে মেসেজ
    }

    // পেজিনেশন লিঙ্ক
    echo "<div class='pagination'>";
    if ($page > 1) {
        echo "<a href='?page=" . ($page - 1) . "&search=" . urlencode($search_query) . "'>Previous</a>";
    }
    for ($i = 1; $i <= $total_pages; $i++) {
        echo "<a href='?page=$i&search=" . urlencode($search_query) . "'>$i</a>";
    }
    if ($page < $total_pages) {
        echo "<a href='?page=" . ($page + 1) . "&search=" . urlencode($search_query) . "'>Next</a>";
    }
    echo "</div>";
    ?>

</body>

</html>

<?php
// ডাটাবেস সংযোগ বন্ধ করা
$conn->close();
?>
