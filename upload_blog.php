<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Blog Post</title>
    <style>
        /* Basic CSS for page layout */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f9;
        }

        header {
            background-color: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }

        h1 {
            margin: 0;
        }

        /* Form Styling */
        form {
            background-color: white;
            padding: 20px;
            margin: 20px auto;
            width: 50%;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        label {
            font-size: 14px;
            color: #333;
            margin-bottom: 5px;
            display: block;
        }

        input[type="text"],
        textarea,
        input[type="file"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 14px;
        }

        textarea {
            resize: vertical;
        }

        input[type="submit"] {
            background-color: #5cb85c;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        input[type="submit"]:hover {
            background-color: #4cae4c;
        }

        input[type="submit"]:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        input[type="text"]:focus,
        textarea:focus,
        input[type="file"]:focus {
            border-color: #5cb85c;
            box-shadow: 0 0 5px rgba(92, 184, 92, 0.5);
        }

        /* Error messages */
        .error {
            color: red;
            font-size: 12px;
            margin-bottom: 10px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            form {
                width: 90%;
            }
        }
    </style>

    <script>
        // Frontend validation
        function validateForm() {
            const form = document.forms["blogForm"];
            const fields = ["title", "writer", "content", "category", "seo_title", "seo_description", "photo"];
            let valid = true;

            // Check if all fields are filled
            for (let field of fields) {
                const input = form[field];
                const errorMessage = document.getElementById(field + "Error");

                if (input.value.trim() === "") {
                    errorMessage.textContent = `Please fill out the ${field.replace('_', ' ')} field.`;
                    valid = false;
                } else {
                    errorMessage.textContent = "";
                }
            }

            // Validate the photo type (only images)
            const fileInput = form["photo"];
            const file = fileInput.files[0];
            if (file) {
                const fileType = file.type.split('/')[0];
                if (fileType !== 'image') {
                    alert("Please upload a valid image file.");
                    valid = false;
                }

                // Check the file size (max 5MB)
                const fileSize = file.size;
                if (fileSize > 5 * 1024 * 1024) {
                    alert("File size should not exceed 5MB.");
                    valid = false;
                }
            }

            return valid;
        }
    </script>
</head>
<body>
    
    <header>
        <h1>Upload New Blog Post</h1>
    </header>
    <form name="blogForm" method="POST" action="process_blog.php" enctype="multipart/form-data" onsubmit="return validateForm()">
        <!-- Blog Title -->
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" placeholder="Enter blog title" required>
        <div id="titleError" class="error"></div>

        <!-- Writer Name -->
        <label for="writer">Writer:</label>
        <input type="text" id="writer" name="writer" placeholder="Enter writer's name" required>
        <div id="writerError" class="error"></div>

        <!-- Content/Description -->
        <label for="content">Content:</label>
        <textarea id="content" name="content" placeholder="Write your blog content here..." required></textarea>
        <div id="contentError" class="error"></div>

        <!-- Blog Category -->
        <label for="category">Category:</label>
        <input type="text" id="category" name="category" placeholder="Enter blog category" required>
        <div id="categoryError" class="error"></div>

        <!-- SEO Title -->
        <label for="seo_title">SEO Title:</label>
        <input type="text" id="seo_title" name="seo_title" placeholder="Enter SEO-friendly title" required>
        <div id="seo_titleError" class="error"></div>

        <!-- SEO Description -->
        <label for="seo_description">SEO Description:</label>
        <textarea id="seo_description" name="seo_description" placeholder="Enter SEO description" required></textarea>
        <div id="seo_descriptionError" class="error"></div>

        <!-- Photo Upload -->
        <label for="photo">Upload Photo:</label>
        <input type="file" id="photo" name="photo" accept="image/*" required>
        <div id="photoError" class="error"></div>

        <!-- Submit Button -->
        <input type="submit" value="Upload Post">
    </form>
</body>
</html>
