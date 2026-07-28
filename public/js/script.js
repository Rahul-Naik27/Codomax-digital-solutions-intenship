document.addEventListener("DOMContentLoaded", () => {
  const blogForm = document.getElementById("blogForm");

  if (blogForm) {
    blogForm.addEventListener("submit", handleBlogSubmit);

    document
      .getElementById("blogTitle")
      .addEventListener("input", () => validateTitle());
    document
      .getElementById("blogAuthor")
      .addEventListener("input", () => validateAuthor());
    document
      .getElementById("blogContent")
      .addEventListener("input", () => validateContent());
  }

  // Load blogs on any page that has a blog grid (home or blog page)
  loadBlogs();
});

async function handleBlogSubmit(e) {
  e.preventDefault();

  const isTitleValid = validateTitle();
  const isAuthorValid = validateAuthor();
  const isContentValid = validateContent();

  if (isTitleValid && isAuthorValid && isContentValid) {
    const title = document.getElementById("blogTitle").value.trim();
    const author = document.getElementById("blogAuthor").value.trim();
    const content = document.getElementById("blogContent").value.trim();

    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, content }),
      });

      if (!response.ok) {
        throw new Error("Failed to add blog");
      }

      const data = await response.json();
      console.log("Blog added:", data);

      document.getElementById("blogForm").reset();
      clearAllErrors();

      // Reload blogs from server so the new one shows up
      loadBlogs();
    } catch (error) {
      console.error("Error adding blog:", error);
      alert("Something went wrong while adding the blog. Please try again.");
    }
  }
}

// Fetch all blogs from the backend and render them
// Works on both Home page (#homeBlogGrid) and Blog page (.blog-grid)
async function loadBlogs() {
  const homeGrid = document.getElementById("homeBlogGrid");
  const blogPageGrid = document.querySelector(".blog-grid:not(#homeBlogGrid)");

  const targetGrid = homeGrid || blogPageGrid;

  if (!targetGrid) return; // no blog grid on this page, do nothing

  try {
    const response = await fetch("/api/blogs");
    const blogs = await response.json();

    targetGrid.innerHTML = ""; // clear existing cards before re-rendering

    // On Home page, show only the latest 3 posts as a preview
    const blogsToShow = homeGrid ? blogs.slice(-3).reverse() : blogs;

    blogsToShow.forEach((blog) => {
      const card = document.createElement("article");
      card.classList.add("blog-card");
      card.innerHTML = `
        <h2>${blog.title}</h2>
        <p class="blog-author">By ${blog.author}</p>
        <p>${blog.content}</p>
        <button class="btn-secondary">Read More</button>
      `;
      targetGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading blogs:", error);
  }
}

// ===== Validation functions (unchanged from Day 4) =====
function validateTitle() {
  const title = document.getElementById("blogTitle").value.trim();
  const errorEl = document.getElementById("titleError");

  if (title === "") {
    errorEl.textContent = "Title is required.";
    return false;
  }
  if (title.length < 5) {
    errorEl.textContent = "Title must be at least 5 characters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function validateAuthor() {
  const author = document.getElementById("blogAuthor").value.trim();
  const errorEl = document.getElementById("authorError");
  const nameRegex = /^[A-Za-z\s]+$/;

  if (author === "") {
    errorEl.textContent = "Author name is required.";
    return false;
  }
  if (!nameRegex.test(author)) {
    errorEl.textContent = "Author name should only contain letters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function validateContent() {
  const content = document.getElementById("blogContent").value.trim();
  const errorEl = document.getElementById("contentError");

  if (content === "") {
    errorEl.textContent = "Content is required.";
    return false;
  }
  if (content.length < 20) {
    errorEl.textContent = "Content must be at least 20 characters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function clearAllErrors() {
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.textContent = ""));
}
