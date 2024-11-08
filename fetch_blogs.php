<?php
// Database connection
$host = 'localhost';
$username = 'root';
$password = '';
$database = ' blog_system';

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$postsPerPage = 6;
$offset = ($page - 1) * $postsPerPage;

$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$category = isset($_GET['category']) && $_GET['category'] !== 'all' ? $conn->real_escape_string($_GET['category']) : '';

$searchQuery = $search ? "AND (title LIKE '%$search%' OR description LIKE '%$search%')" : '';
$categoryQuery = $category ? "AND category = '$category'" : '';

// Get total posts
$totalPostsQuery = "SELECT COUNT(*) as total FROM blogs WHERE 1=1 $searchQuery $categoryQuery";
$totalPostsResult = $conn->query($totalPostsQuery);
$totalPosts = $totalPostsResult->fetch_assoc()['total'];

// Get blogs with pagination
$sql = "SELECT id, title, writer, DATE_FORMAT(date, '%M %d, %Y') as formatted_date, comments, description, photo, link 
        FROM blogs 
        WHERE 1=1 $searchQuery $categoryQuery 
        ORDER BY date DESC 
        LIMIT $offset, $postsPerPage";

$result = $conn->query($sql);

$blogs = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $blogs[] = $row;
    }
}

echo json_encode([
    'blogs' => $blogs,
    'totalPages' => ceil($totalPosts / $postsPerPage)
]);

$conn->close();
?>
