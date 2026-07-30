const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies (needed for POST requests)
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// In-memory array to temporarily store blog posts (no database yet)
let blogs = [
  {
    id: 1,
    title: "My First Day as an Intern",
    author: "Rahul",
    content:
      "Set up my development environment and built my first Express server.",
  },
  {
    id: 2,
    title: "Learning HTML Basics",
    author: "Rahul",
    content: "Practiced building structured pages using semantic HTML tags.",
  },
];

// ===== GET route: fetch all blogs =====
app.get("/api/blogs", (req, res) => {
  res.json(blogs);
});

// ===== GET route: fetch a single blog by id =====
app.get("/api/blogs/:id", (req, res) => {
  const blog = blogs.find((b) => b.id === parseInt(req.params.id));

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.json(blog);
});

// ===== POST route: add a new blog =====
app.post("/api/blogs", (req, res) => {
  const { title, author, content } = req.body;

  if (!title || !author || !content) {
    return res
      .status(400)
      .json({ message: "Title, author, and content are required." });
  }

  const newBlog = {
    id: blogs.length + 1,
    title,
    author,
    content,
  };

  blogs.push(newBlog);
  res.status(201).json({ message: "Blog added successfully", blog: newBlog });
});

// ===== PUT route: update an existing blog =====
app.put("/api/blogs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, author, content } = req.body;

  const blog = blogs.find((b) => b.id === id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (!title || !author || !content) {
    return res
      .status(400)
      .json({ message: "Title, author, and content are required." });
  }

  blog.title = title;
  blog.author = author;
  blog.content = content;

  res.json({ message: "Blog updated successfully", blog });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
