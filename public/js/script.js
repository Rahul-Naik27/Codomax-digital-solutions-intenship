// ==========================================================================
// Codomax Digital Solutions - Client-Side Interactive Engine
// ==========================================================================

let allBlogsCache = [];
let currentCategory = "All";
let currentSearchQuery = "";
let postToDeleteId = null;
let currentReadingPost = null;

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initFormListeners();
  initSearchAndFilters();
  initModalBackdrops();
  loadBlogs();
});

// ===== Mobile Navigation Drawer Toggle =====
function initMobileMenu() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const drawer = document.getElementById("mobileNavDrawer");

  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      drawer.classList.toggle("open");
    });
  }
}

// ===== Event Listeners for Forms & Controls =====
function initFormListeners() {
  // Add Blog Form
  const blogForm = document.getElementById("blogForm");
  if (blogForm) {
    blogForm.addEventListener("submit", handleBlogSubmit);

    const titleInput = document.getElementById("blogTitle");
    const authorInput = document.getElementById("blogAuthor");
    const contentInput = document.getElementById("blogContent");

    if (titleInput) titleInput.addEventListener("input", validateTitle);
    if (authorInput) authorInput.addEventListener("input", validateAuthor);
    if (contentInput) contentInput.addEventListener("input", validateContent);
  }

  // Add Blog Section Toggles
  const openAddBtn = document.getElementById("openAddBlogModalBtn");
  const toggleAddBtn = document.getElementById("toggleAddBlogCardBtn");
  const closeAddBtn = document.getElementById("closeAddBlogSectionBtn");
  const cancelAddBtn = document.getElementById("cancelAddBlogBtn");
  const addBlogSection = document.getElementById("addBlogSection");

  const openAddForm = () => {
    if (addBlogSection) {
      addBlogSection.classList.remove("hidden");
      addBlogSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const closeAddForm = () => {
    if (addBlogSection) {
      addBlogSection.classList.add("hidden");
      if (blogForm) blogForm.reset();
      clearAllErrors();
    }
  };

  if (openAddBtn) openAddBtn.addEventListener("click", openAddForm);
  if (toggleAddBtn) toggleAddBtn.addEventListener("click", openAddForm);
  if (closeAddBtn) closeAddBtn.addEventListener("click", closeAddForm);
  if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddForm);

  // Edit Blog Form
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
    
    const cancelEditBtn = document.getElementById("cancelEdit");
    const cancelEditCross = document.getElementById("cancelEditCross");
    if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
    if (cancelEditCross) cancelEditCross.addEventListener("click", closeEditModal);
  }

  // Read Modal Close Buttons
  const closeReadBtn = document.getElementById("closeReadModal");
  const closeReadModalBtn = document.getElementById("closeReadModalBtn");
  if (closeReadBtn) closeReadBtn.addEventListener("click", closeReadModal);
  if (closeReadModalBtn) closeReadModalBtn.addEventListener("click", closeReadModal);

  // Like Button inside Read Modal
  const readLikeBtn = document.getElementById("readLikeBtn");
  if (readLikeBtn) {
    readLikeBtn.addEventListener("click", handleReadModalLike);
  }

  // Delete Modal Confirmation
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", executeBlogDelete);

  // Contact Form Submission
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }

  // Reset Filters Button
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      currentCategory = "All";
      currentSearchQuery = "";
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      
      document.querySelectorAll(".pill-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.category === "All");
      });

      renderFilteredBlogs();
    });
  }
}

// ===== Search and Filter Setup =====
function initSearchAndFilters() {
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const categoryPills = document.getElementById("categoryPills");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle("hidden", currentSearchQuery === "");
      }
      renderFilteredBlogs();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      currentSearchQuery = "";
      clearSearchBtn.classList.add("hidden");
      renderFilteredBlogs();
    });
  }

  if (categoryPills) {
    categoryPills.addEventListener("click", (e) => {
      const targetPill = e.target.closest(".pill-btn");
      if (!targetPill) return;

      document.querySelectorAll(".pill-btn").forEach((btn) => btn.classList.remove("active"));
      targetPill.classList.add("active");

      currentCategory = targetPill.dataset.category || "All";
      renderFilteredBlogs();
    });
  }
}

// ===== Backdrop Click to Close Modals =====
function initModalBackdrops() {
  const readBackdrop = document.getElementById("readModalBackdrop");
  const editBackdrop = document.getElementById("editModalBackdrop");
  const deleteBackdrop = document.getElementById("deleteModalBackdrop");

  if (readBackdrop) readBackdrop.addEventListener("click", closeReadModal);
  if (editBackdrop) editBackdrop.addEventListener("click", closeEditModal);
  if (deleteBackdrop) deleteBackdrop.addEventListener("click", closeDeleteModal);
}

// ===== Load Blogs from Backend Server =====
async function loadBlogs() {
  const homeGrid = document.getElementById("homeBlogGrid");
  const blogPageGrid = document.getElementById("blogPageGrid");
  const targetGrid = homeGrid || blogPageGrid;

  if (!targetGrid) return;

  try {
    const response = await fetch("/api/blogs");
    if (!response.ok) throw new Error("Failed to load blog posts from API");
    
    allBlogsCache = await response.json();
    renderFilteredBlogs();
  } catch (error) {
    console.error("Error loading blogs:", error);
    showToast("Unable to connect to Express backend server.", "error");
    if (targetGrid) {
      targetGrid.innerHTML = `
        <div class="no-results-state">
          <h3>Failed to load articles</h3>
          <p>Please make sure the Node.js server is running on port 3000.</p>
        </div>
      `;
    }
  }
}

// ===== Filter & Render Blogs on Page =====
function renderFilteredBlogs() {
  const homeGrid = document.getElementById("homeBlogGrid");
  const blogPageGrid = document.getElementById("blogPageGrid");
  const noResultsState = document.getElementById("noResultsState");

  // Home preview: Latest 3 posts
  if (homeGrid) {
    homeGrid.innerHTML = "";
    const latestBlogs = [...allBlogsCache].reverse().slice(0, 3);

    if (latestBlogs.length === 0) {
      homeGrid.innerHTML = `<p class="text-muted">No posts available.</p>`;
      return;
    }

    latestBlogs.forEach((blog) => {
      const card = createBlogCardElement(blog, true);
      homeGrid.appendChild(card);
    });
    attachCardEventListeners();
    return;
  }

  // Blog Page Grid
  if (blogPageGrid) {
    blogPageGrid.innerHTML = "";

    const filtered = allBlogsCache.filter((blog) => {
      const matchesCategory =
        currentCategory === "All" ||
        (blog.category && blog.category.toLowerCase() === currentCategory.toLowerCase());

      const titleMatch = blog.title ? blog.title.toLowerCase().includes(currentSearchQuery) : false;
      const contentMatch = blog.content ? blog.content.toLowerCase().includes(currentSearchQuery) : false;
      const authorMatch = blog.author ? blog.author.toLowerCase().includes(currentSearchQuery) : false;
      const matchesSearch = currentSearchQuery === "" || titleMatch || contentMatch || authorMatch;

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      if (noResultsState) noResultsState.classList.remove("hidden");
    } else {
      if (noResultsState) noResultsState.classList.add("hidden");
      filtered.reverse().forEach((blog) => {
        const card = createBlogCardElement(blog, false);
        blogPageGrid.appendChild(card);
      });
      attachCardEventListeners();
    }
  }
}

// ===== Create Blog Card HTML Element =====
function createBlogCardElement(blog, isHomePreview) {
  const card = document.createElement("article");
  card.className = "blog-card";
  card.dataset.id = blog.id;

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author || "User")}`;
  const avatarUrl = blog.authorAvatar || defaultAvatar;

  const coverUrl = blog.coverImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80";

  let categoryClass = "cat-webdev";
  const catLower = (blog.category || "").toLowerCase();
  if (catLower.includes("internship")) categoryClass = "cat-internship";
  else if (catLower.includes("design")) categoryClass = "cat-design";
  else if (catLower.includes("ai")) categoryClass = "cat-aitech";

  const editDeleteButtons = isHomePreview
    ? ""
    : `
      <button class="icon-action-btn edit-btn" data-id="${blog.id}" title="Edit Post">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-action-btn delete-btn" data-id="${blog.id}" title="Delete Post">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    `;

  card.innerHTML = `
    <div class="blog-card-media">
      <img src="${coverUrl}" alt="${escapeHtml(blog.title)}" loading="lazy" onError="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'" />
      <span class="category-badge-floating ${categoryClass}">${escapeHtml(blog.category || "General")}</span>
    </div>

    <div class="blog-card-content">
      <div class="blog-meta-header">
        <img src="${avatarUrl}" alt="${escapeHtml(blog.author)}" class="author-avatar" onError="this.src='${defaultAvatar}'" />
        <div class="author-info">
          <span class="author-name">${escapeHtml(blog.author || "Anonymous")}</span>
          <span class="post-date">${blog.date || "Aug 2026"}</span>
        </div>
      </div>

      <h2 class="card-title-clickable" data-id="${blog.id}">${escapeHtml(blog.title)}</h2>
      <p class="blog-excerpt">${escapeHtml(blog.content)}</p>

      <div class="blog-card-footer">
        <span class="read-time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${blog.readTime || "4 min read"}
        </span>

        <div class="blog-card-actions">
          <button class="btn-like card-like-btn" data-id="${blog.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>${blog.likes || 0}</span>
          </button>
          <button class="btn-secondary read-btn" data-id="${blog.id}">Read</button>
          ${editDeleteButtons}
        </div>
      </div>
    </div>
  `;

  return card;
}

// ===== Attach Event Listeners to Card Buttons =====
function attachCardEventListeners() {
  // Read article triggers
  document.querySelectorAll(".read-btn, .card-title-clickable").forEach((btn) => {
    btn.addEventListener("click", () => openReadModal(btn.dataset.id));
  });

  // Edit triggers
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });

  // Delete triggers
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteModal(btn.dataset.id);
    });
  });

  // Card Like buttons
  document.querySelectorAll(".card-like-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(btn.dataset.id);
    });
  });
}

// ===== Handle New Blog Submission (POST) =====
async function handleBlogSubmit(e) {
  e.preventDefault();

  const isTitleValid = validateTitle();
  const isAuthorValid = validateAuthor();
  const isContentValid = validateContent();

  if (isTitleValid && isAuthorValid && isContentValid) {
    const title = document.getElementById("blogTitle").value.trim();
    const author = document.getElementById("blogAuthor").value.trim();
    const category = document.getElementById("blogCategory").value;
    const coverImage = document.getElementById("blogCover").value.trim();
    const content = document.getElementById("blogContent").value.trim();

    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, category, coverImage, content }),
      });

      if (!response.ok) throw new Error("Failed to publish blog post");

      const result = await response.json();
      showToast("Article published successfully!", "success");

      document.getElementById("blogForm").reset();
      clearAllErrors();

      const addBlogSection = document.getElementById("addBlogSection");
      if (addBlogSection) addBlogSection.classList.add("hidden");

      await loadBlogs();
    } catch (error) {
      console.error("Error creating blog:", error);
      showToast("Something went wrong while publishing.", "error");
    }
  }
}

// ===== Read Post Modal =====
function openReadModal(id) {
  const blog = allBlogsCache.find((b) => b.id === parseInt(id));
  if (!blog) return;

  currentReadingPost = blog;

  const modal = document.getElementById("readModal");
  const readCover = document.getElementById("readCoverImage");
  const readCategory = document.getElementById("readCategory");
  const readAuthorAvatar = document.getElementById("readAuthorAvatar");
  const readAuthor = document.getElementById("readAuthor");
  const readDate = document.getElementById("readDate");
  const readTime = document.getElementById("readTime");
  const readTitle = document.getElementById("readTitle");
  const readBody = document.getElementById("readBody");
  const readLikeCount = document.getElementById("readLikeCount");

  if (readCover) readCover.src = blog.coverImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80";
  if (readCategory) readCategory.textContent = blog.category || "General";
  if (readAuthorAvatar) readAuthorAvatar.src = blog.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(blog.author)}`;
  if (readAuthor) readAuthor.textContent = blog.author;
  if (readDate) readDate.textContent = blog.date || "Aug 2026";
  if (readTime) readTime.textContent = blog.readTime || "4 min read";
  if (readTitle) readTitle.textContent = blog.title;
  if (readBody) readBody.textContent = blog.content;
  if (readLikeCount) readLikeCount.textContent = blog.likes || 0;

  if (modal) modal.classList.remove("hidden");
}

function closeReadModal() {
  const modal = document.getElementById("readModal");
  if (modal) modal.classList.add("hidden");
  currentReadingPost = null;
}

// ===== Edit Blog Modal (PUT) =====
function openEditModal(id) {
  const blog = allBlogsCache.find((b) => b.id === parseInt(id));
  if (!blog) return;

  document.getElementById("editBlogId").value = blog.id;
  document.getElementById("editTitle").value = blog.title;
  document.getElementById("editAuthor").value = blog.author;
  if (document.getElementById("editCategory")) document.getElementById("editCategory").value = blog.category || "General";
  if (document.getElementById("editCover")) document.getElementById("editCover").value = blog.coverImage || "";
  document.getElementById("editContent").value = blog.content;

  const modal = document.getElementById("editModal");
  if (modal) modal.classList.remove("hidden");
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) modal.classList.add("hidden");
  const editForm = document.getElementById("editForm");
  if (editForm) editForm.reset();
  clearAllErrors();
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("editBlogId").value;
  const title = document.getElementById("editTitle").value.trim();
  const author = document.getElementById("editAuthor").value.trim();
  const category = document.getElementById("editCategory") ? document.getElementById("editCategory").value : "General";
  const coverImage = document.getElementById("editCover") ? document.getElementById("editCover").value.trim() : "";
  const content = document.getElementById("editContent").value.trim();

  if (!title || !author || !content) {
    showToast("Title, Author, and Content are required.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, category, coverImage, content }),
    });

    if (!response.ok) throw new Error("Failed to update post");

    showToast("Blog post updated successfully!", "success");
    closeEditModal();
    await loadBlogs();
  } catch (error) {
    console.error("Error updating blog:", error);
    showToast("Something went wrong while updating.", "error");
  }
}

// ===== Delete Modal Handlers (DELETE) =====
function openDeleteModal(id) {
  postToDeleteId = id;
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  postToDeleteId = null;
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) deleteModal.classList.add("hidden");
}

async function executeBlogDelete() {
  if (!postToDeleteId) return;

  try {
    const response = await fetch(`/api/blogs/${postToDeleteId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete post");

    showToast("Blog post deleted successfully.", "info");
    closeDeleteModal();
    await loadBlogs();
  } catch (error) {
    console.error("Error deleting blog:", error);
    showToast("Something went wrong while deleting.", "error");
  }
}

// ===== Like Toggling (PATCH) =====
async function toggleLike(id) {
  try {
    const response = await fetch(`/api/blogs/${id}/like`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });

    if (!response.ok) throw new Error("Failed to toggle like");

    const data = await response.json();
    const blog = allBlogsCache.find((b) => b.id === parseInt(id));
    if (blog) blog.likes = data.likes;

    renderFilteredBlogs();
    showToast("Liked post! ❤️", "info");
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

async function handleReadModalLike() {
  if (!currentReadingPost) return;
  await toggleLike(currentReadingPost.id);
  const readLikeCount = document.getElementById("readLikeCount");
  if (readLikeCount) readLikeCount.textContent = currentReadingPost.likes || 0;
}

// ===== Contact Form Handler =====
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    showToast("Please fill in all contact fields.", "error");
    return;
  }

  const submitBtn = document.getElementById("contactSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Sending...</span>`;
  }

  setTimeout(() => {
    showToast(`Thank you ${name}! Your message has been sent.`, "success");
    document.getElementById("contactForm").reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Send Message</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    }
  }, 1000);
}

// ===== Validations =====
function validateTitle() {
  const input = document.getElementById("blogTitle");
  const errorEl = document.getElementById("titleError");
  if (!input || !errorEl) return true;

  const value = input.value.trim();
  if (value === "") {
    errorEl.textContent = "Article title is required.";
    return false;
  }
  if (value.length < 5) {
    errorEl.textContent = "Title must be at least 5 characters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function validateAuthor() {
  const input = document.getElementById("blogAuthor");
  const errorEl = document.getElementById("authorError");
  if (!input || !errorEl) return true;

  const value = input.value.trim();
  const nameRegex = /^[A-Za-z\s]+$/;

  if (value === "") {
    errorEl.textContent = "Author name is required.";
    return false;
  }
  if (!nameRegex.test(value)) {
    errorEl.textContent = "Author name should only contain letters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function validateContent() {
  const input = document.getElementById("blogContent");
  const errorEl = document.getElementById("contentError");
  if (!input || !errorEl) return true;

  const value = input.value.trim();
  if (value === "") {
    errorEl.textContent = "Article content is required.";
    return false;
  }
  if (value.length < 20) {
    errorEl.textContent = "Content must be at least 20 characters.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
}

// ===== Toast Notification Helper =====
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  if (type === "success") {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper to escape HTML characters safely
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
