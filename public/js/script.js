document.addEventListener("DOMContentLoaded", () => {
  const blogForm = document.getElementById("blogForm");

  if (blogForm) {
    blogForm.addEventListener("submit", handleBlogSubmit);

    // Real-time validation as user types
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
});

function handleBlogSubmit(e) {
  e.preventDefault();

  const isTitleValid = validateTitle();
  const isAuthorValid = validateAuthor();
  const isContentValid = validateContent();

  if (isTitleValid && isAuthorValid && isContentValid) {
    addBlogCard();
    document.getElementById("blogForm").reset();
    clearAllErrors();
  }
}

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

// Dynamically add a new blog card to the page after successful validation
function addBlogCard() {
  const title = document.getElementById("blogTitle").value.trim();
  const author = document.getElementById("blogAuthor").value.trim();
  const content = document.getElementById("blogContent").value.trim();

  const blogGrid = document.querySelector(".blog-grid");

  const card = document.createElement("article");
  card.classList.add("blog-card");

  card.innerHTML = `
    <h2>${title}</h2>
    <p class="blog-author">By ${author}</p>
    <p>${content}</p>
    <button class="btn-secondary">Read More</button>
  `;

  blogGrid.prepend(card);
}
