<?php
session_start();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Check if the user is an admin (you can check this from a database)
    include('db_connection.php');
    $sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $username, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // User found, start session
        $user = $result->fetch_assoc();
        $_SESSION['user'] = $user['username'];  // Store username in session
        $_SESSION['role'] = $user['role'];      // Store user role (admin, user, etc.)
        if ($user['role'] == 'admin') {
            header('Location: admin_dashboard.php');
            exit();
        } else {
            echo "You do not have admin access.";
        }
    } else {
        echo "Invalid username or password.";
    }
}
?>
<form method="POST" action="">
    <label for="username">Username</label>
    <input type="text" name="username" id="username" required>

    <label for="password">Password</label>
    <input type="password" name="password" id="password" required>

    <button type="submit">Login</button>
</form>
