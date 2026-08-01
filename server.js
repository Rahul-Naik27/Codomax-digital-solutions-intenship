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
    title: "Mastering Full Stack Development: My Internship Experience at Codomax",
    author: "Rahul Naik",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    category: "Internship",
    coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    readTime: "5 min read",
    date: "Aug 1, 2026",
    likes: 24,
    content: "Setting up my production-grade Node.js and Express development environment marked day one of my journey at Codomax Digital Solutions. During this internship, I built RESTful APIs, designed responsive UIs, and learned how modern full-stack architectures handle scalable web requests smoothly.",
  },
  {
    id: 2,
    title: "Modern UI/UX Design System with Pure CSS and Glassmorphism",
    author: "Sophia Chen",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    category: "Design",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    readTime: "4 min read",
    date: "Jul 28, 2026",
    likes: 38,
    content: "Building beautiful user interfaces without relying on heavy frontend frameworks requires a solid CSS design system. By establishing custom color tokens, modern typography standards, and glassmorphic backdrop filters, we can craft web apps that look incredible while maintaining blazing fast loading speeds.",
  },
  {
    id: 3,
    title: "Building Scalable REST APIs in Node.js & Express 5",
    author: "Alex Morgan",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    category: "Web Dev",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    readTime: "6 min read",
    date: "Jul 22, 2026",
    likes: 42,
    content: "Express 5 introduces asynchronous route handling improvements and stricter parameter handling. In this article, we break down best practices for API architecture, standardizing middleware validation, error propagation, and structured JSON responses for production applications.",
  },
  {
    id: 4,
    title: "The Rise of AI-Assisted Software Engineering",
    author: "Rahul Naik",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    category: "AI & Tech",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    readTime: "7 min read",
    date: "Jul 15, 2026",
    likes: 56,
    content: "Artificial intelligence tools like LLM coding agents are rapidly reshaping how developers solve problems. From automated code refactoring to instant bug detection, smart AI assistants allow engineers to focus on architectural decisions while boosting efficiency dramatically.",
  }
];

let nextId = 5; // tracks the next available id

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
  const { title, author, content, category, coverImage } = req.body;

  if (!title || !author || !content) {
    return res
      .status(400)
      .json({ message: "Title, author, and content are required." });
  }

  const defaultCovers = [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80"
  ];
  const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

  const wordCount = content.trim().split(/\s+/).length;
  const computedReadTime = `${Math.max(1, Math.ceil(wordCount / 50))} min read`;

  const newBlog = {
    id: nextId++,
    title,
    author,
    authorAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`,
    category: category || "General",
    coverImage: coverImage && coverImage.trim() !== "" ? coverImage.trim() : randomCover,
    readTime: computedReadTime,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    likes: 0,
    content,
  };

  blogs.push(newBlog);
  res.status(201).json({ message: "Blog added successfully", blog: newBlog });
});

// ===== PUT route: update an existing blog =====
app.put("/api/blogs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, author, content, category, coverImage } = req.body;

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
  if (category) blog.category = category;
  if (coverImage && coverImage.trim() !== "") blog.coverImage = coverImage.trim();

  res.json({ message: "Blog updated successfully", blog });
});

// ===== PATCH route: toggle like count =====
app.patch("/api/blogs/:id/like", (req, res) => {
  const id = parseInt(req.params.id);
  const blog = blogs.find((b) => b.id === id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const { action } = req.body; // 'like' or 'unlike'
  if (action === "unlike") {
    blog.likes = Math.max(0, blog.likes - 1);
  } else {
    blog.likes = (blog.likes || 0) + 1;
  }

  res.json({ message: "Like updated successfully", likes: blog.likes });
});

// ===== DELETE route: remove a blog =====
app.delete("/api/blogs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const blogIndex = blogs.findIndex((b) => b.id === id);

  if (blogIndex === -1) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const deletedBlog = blogs.splice(blogIndex, 1);

  res.json({ message: "Blog deleted successfully", blog: deletedBlog[0] });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
