<?php
// ডেটাবেস কানেকশন ফাইল অন্তর্ভুক্ত করুন
include('db_connection.php');

// ব্লগ পোস্টগুলি পেতে SQL কুয়েরি
$sql = "SELECT * FROM blog_posts ORDER BY created_at DESC";
$result = $conn->query($sql);

// যদি ব্লগ পোস্ট থাকে, তাহলে সেগুলি দেখান
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "<div class='blog-post'>";
        echo "<h2><a href='single_blog.php?id=" . $row['id'] . "'>" . $row['title'] . "</a></h2>";
        echo "<p>" . substr($row['content'], 0, 100) . "...</p>"; // প্রথম ১০০ অক্ষর দেখানোর জন্য
        echo "<small>Posted on " . $row['created_at'] . "</small>";
        echo "</div>";
    }
} else {
    echo "কোনো ব্লগ পোস্ট পাওয়া যায়নি।";
}

// কানেকশন বন্ধ করুন
$conn->close();
?>
