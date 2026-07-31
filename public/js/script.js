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

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
    document
      .getElementById("cancelEdit")
      .addEventListener("click", closeEditModal);
  }

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

      if (!response.ok) throw new Error("Failed to add blog");

      document.getElementById("blogForm").reset();
      clearAllErrors();
      loadBlogs();
    } catch (error) {
      console.error("Error adding blog:", error);
      alert("Something went wrong while adding the blog. Please try again.");
    }
  }
}

// ===== Load blogs (Home or Blog page) =====
async function loadBlogs() {
  const homeGrid = document.getElementById("homeBlogGrid");
  const blogPageGrid = document.querySelector(".blog-grid:not(#homeBlogGrid)");
  const targetGrid = homeGrid || blogPageGrid;

  if (!targetGrid) return;

  try {
    const response = await fetch("/api/blogs");
    const blogs = await response.json();

    targetGrid.innerHTML = "";

    const blogsToShow = homeGrid ? blogs.slice(-3).reverse() : blogs;

    blogsToShow.forEach((blog) => {
      const card = document.createElement("article");
      card.classList.add("blog-card");

      // Only show Edit and delete button on the Blog page, not the Home preview
      const editButton = homeGrid
        ? ""
        : `<button class="btn-secondary edit-btn" data-id="${blog.id}">Edit</button>`;
      const deleteButton = homeGrid
        ? ""
        : `<button class="btn-danger delete-btn" data-id="${blog.id}">Delete</button>`;

      card.innerHTML = `
        <h2>${blog.title}</h2>
        <p class="blog-author">By ${blog.author}</p>
        <p>${blog.content}</p>
        <div class="blog-card-actions">
          <button class="btn-secondary">Read More</button>
          ${editButton}
          ${deleteButton}
        </div>
      `;
      targetGrid.appendChild(card);
    });

    // Attach click listeners to all Edit buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        openEditModal(btn.dataset.id, blogsToShow),
      );
    });
    // Attach click listeners to all delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleDeleteBlog(btn.dataset.id));
    });
  } catch (error) {
    console.error("Error loading blogs:", error);
    if (targetGrid) {
      targetGrid.innerHTML =
        "<p>Unable to load blogs. Please check if the server is running.</p>";
    }
  }
}

async function handleDeleteBlog(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this blog post?",
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/blogs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete blog");

    loadBlogs();
  } catch (error) {
    console.error("Error deleting blog:", error);
    alert("Something went wrong while deleting the blog.");
  }
}

// ===== Open edit modal and pre-fill with existing data =====
function openEditModal(id, blogs) {
  const blog = blogs.find((b) => b.id === parseInt(id));
  if (!blog) return;

  document.getElementById("editBlogId").value = blog.id;
  document.getElementById("editTitle").value = blog.title;
  document.getElementById("editAuthor").value = blog.author;
  document.getElementById("editContent").value = blog.content;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.getElementById("editForm").reset();
}

// ===== Submit edited blog to backend =====
async function handleEditSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("editBlogId").value;
  const title = document.getElementById("editTitle").value.trim();
  const author = document.getElementById("editAuthor").value.trim();
  const content = document.getElementById("editContent").value.trim();

  if (!title || !author || !content) {
    alert("All fields are required.");
    return;
  }

  try {
    const response = await fetch(`/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, content }),
    });

    if (!response.ok) throw new Error("Failed to update blog");

    closeEditModal();
    loadBlogs();
  } catch (error) {
    console.error("Error updating blog:", error);
    alert("Something went wrong while updating the blog.");
  }
}

// ===== Validation functions (unchanged) =====
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
