<?php
// ডেটাবেস কানেকশন ফাইল অন্তর্ভুক্ত করুন
include('db_connection.php');

// URL থেকে ID প্যারামিটারটি পান
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// যদি ID না পাওয়া যায়, তাহলে একটি ত্রুটি দেখান
if ($id == 0) {
    echo "অবৈধ পোস্ট আইডি।";
    exit;
}

// নির্দিষ্ট ব্লগ পোস্টের জন্য SQL কুয়েরি
$stmt = $conn->prepare("SELECT * FROM blog_posts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

// যদি পোস্ট পাওয়া যায়, তাহলে তা দেখান
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "<h1>" . htmlspecialchars($row['title']) . "</h1>";
    echo "<p>" . nl2br(htmlspecialchars($row['content'])) . "</p>";
    echo "<small>Posted on " . htmlspecialchars($row['created_at']) . "</small>";
} else {
    echo "পোস্টটি পাওয়া যায়নি।";
}

// কানেকশন বন্ধ করুন
$stmt->close();
$conn->close();
?>
