<?php
$servername = "localhost";
$username = "root"; // XAMPP এর ডিফল্ট ইউজারনেম
$password = "";     // XAMPP এর ডিফল্ট পাসওয়ার্ড (খালি)
$dbname = "blog_system"; // আপনার ডেটাবেসের নাম

// কানেকশন তৈরি করুন
$conn = new mysqli($servername, $username, $password, $dbname);

// কানেকশন চেক করুন
if ($conn->connect_error) {
    die("কানেকশন ব্যর্থ হয়েছে: " . $conn->connect_error);
}
?>
