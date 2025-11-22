document.addEventListener("DOMContentLoaded", () => {
  /* ------------ AUTH ELEMENTS ------------ */
  const authContainer = document.getElementById("auth-container");
  const appContainer = document.getElementById("app-container");

  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const loginPanel = document.getElementById("login-panel");
  const signupPanel = document.getElementById("signup-panel");

  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");

  const signupUsername = document.getElementById("signup-username");
  const signupPassword = document.getElementById("signup-password");
  const signupBtn = document.getElementById("signup-btn");

  const welcomeUserSpan = document.getElementById("welcome-user");
  const logoutBtn = document.getElementById("logout-btn");

  /* ------------ APP ELEMENTS ------------ */
  const addStoryBtn = document.getElementById("add-story-btn");
  const backArrow = document.getElementById("back-arrow");
  const toolbar = document.querySelector(".toolbar");
  const addStorySection = document.getElementById("add-story-section");
  const formTitle = document.getElementById("form-title");
  const mainHeader = document.getElementById("main-header");


  const searchInput = document.getElementById("search-input");
  const ageFilter = document.getElementById("age-filter");
  const storiesCount = document.getElementById("stories-count");
  const storiesList = document.getElementById("stories-list");
  const storiesSection = document.getElementById("stories-section");

  const entityInput = document.getElementById("entity-input");
  const virtuesInput = document.getElementById("virtues-input");
  const keywordsInput = document.getElementById("keywords-input");
  const ageInput = document.getElementById("age-input");
  const groupInput = document.getElementById("group-input");
  const storyTextInput = document.getElementById("story-text-input");

  const saveStoryBtn = document.getElementById("save-story-btn");
  const cancelStoryBtn = document.getElementById("cancel-story-btn");

  const importCsvBtn = document.getElementById("import-csv-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const csvFileInput = document.getElementById("csv-file-input");


// MENU DROPDOWN
const menuBtn = document.getElementById("menu-btn");
const menuDropdown = document.getElementById("menu-dropdown");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("dropdown-hidden");
});

// Close menu on outside click
document.addEventListener("click", () => {
  if (!menuDropdown.classList.contains("dropdown-hidden")) {
    menuDropdown.classList.add("dropdown-hidden");
  }
});



  /* ------------ STATE ------------ */
  let stories = [];
  let editingId = null;
  let searchTerm = "";
  let currentAgeFilter = "all";

  /* ------------ HELPERS ------------ */

  function showElement(el) {
    el.classList.remove("hidden");
  }

  function hideElement(el) {
    el.classList.add("hidden");
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function truncate(text, maxLength = 300) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  function normalizeStoryText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  // Check if a story with the same text already exists.
  // skipId is used while editing to ignore the current story.
  function storyExistsWithText(text, skipId = null) {
    const target = normalizeStoryText(text);
    if (!target) return false;

    return stories.some((s) => {
      if (skipId && String(s.id) === String(skipId)) return false;
      return normalizeStoryText(s.storyText) === target;
    });
  }

  // Reassign IDs so they are always 1..N in current order
  function reindexStories() {
    stories = stories.map((s, idx) => ({
      ...s,
      id: idx + 1,
    }));
  }

  function saveStories() {
    localStorage.setItem("stories-data", JSON.stringify(stories));
    updateExportCount();
  }

  function loadStories() {
    try {
      const raw = localStorage.getItem("stories-data");
      stories = raw ? JSON.parse(raw) : [];
    } catch {
      stories = [];
    }
    // Ensure serial IDs regardless of what was stored before
    reindexStories();
    renderFilters();
    renderStories();
    updateExportCount();
  }

  function updateExportCount() {
    if (exportCsvBtn) {
      exportCsvBtn.textContent = `Export CSV (${stories.length})`;
    }
  }

  function clearForm() {
    entityInput.value = "";
    virtuesInput.value = "";
    keywordsInput.value = "";
    ageInput.value = "";
    groupInput.value = "";
    storyTextInput.value = "";
    editingId = null;
    formTitle.textContent = "Add New Story";
    saveStoryBtn.textContent = "Save Story";
  }

  function openFormForNew() {
    clearForm();
    showElement(addStorySection);
    addStoryBtn.textContent = "Close Add Story";
  }

    function openFormForEdit(story) {
    editingId = story.id;
    formTitle.textContent = "Edit Story";
    saveStoryBtn.textContent = "Update Story";

    entityInput.value = story.entity || "";
    virtuesInput.value = story.virtues || "";
    keywordsInput.value = story.keywords || "";
    ageInput.value = story.age || "";
    groupInput.value = story.group || "";
    storyTextInput.value = story.storyText || "";

    showElement(addStorySection);
    toolbar.classList.add("hidden");
    storiesSection.classList.add("hidden");
    mainHeader.classList.add("hidden");
    }

    function closeForm() {
    hideElement(addStorySection);
    hideElement(backArrow);
    mainHeader.classList.remove("hidden");
    toolbar.classList.remove("hidden");
    storiesSection.classList.remove("hidden"); 
    clearForm();
    }

  function renderFilters() {
    const groups = Array.from(
      new Set(
        stories
          .map((s) => (s.age || "").trim())
          .filter((a) => a !== "")
      )
    );

    const current = currentAgeFilter;
    ageFilter.innerHTML = '<option value="all">All Age Groups</option>';

    groups.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      ageFilter.appendChild(opt);
    });

    if (current !== "all" && groups.includes(current)) {
      ageFilter.value = current;
    } else {
      ageFilter.value = "all";
      currentAgeFilter = "all";
    }
  }

  function renderStories() {
    const term = searchTerm.trim().toLowerCase();
    const filtered = stories.filter((s) => {
      const matchesAge =
        currentAgeFilter === "all" || s.age === currentAgeFilter;

      if (!matchesAge) return false;

      if (!term) return true;

      const combined =
        (s.entity || "") +
        " " +
        (s.virtues || "") +
        " " +
        (s.keywords || "") +
        " " +
        (s.storyText || "");

      return combined.toLowerCase().includes(term);
    });

    storiesCount.textContent = filtered.length.toString();

    if (filtered.length === 0) {
      storiesList.innerHTML =
        '<div class="empty-state">No stories found. Start adding stories to build your dataset.</div>';
      return;
    }

    let html = "";
    filtered.forEach((s) => {
    html += `
        <tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.entity)}</td>
        <td>${escapeHtml(s.age)}</td>
        <td>${escapeHtml(s.group)}</td>
        <td>
            <button class="btn-ghost" data-action="edit" data-id="${s.id}">Edit</button>
            <button class="btn-ghost danger" data-action="delete" data-id="${s.id}">Delete</button>
        </td>
        </tr>
    `;
    });
    storiesList.innerHTML = html;


    // let html = "";
    // filtered.forEach((s) => {
    //   html += `
    //     <div class="story-card">
    //       <div class="story-header">
    //         <div>
    //           <h3 class="story-title">${escapeHtml(s.entity)}</h3>
    //           <div class="story-chips">
    //             ${
    //               s.virtues
    //                 ? `<span class="chip chip-purple">${escapeHtml(
    //                     s.virtues
    //                   )}</span>`
    //                 : ""
    //             }
    //             ${
    //               s.group
    //                 ? `<span class="chip chip-blue">${escapeHtml(
    //                     s.group
    //                   )}</span>`
    //                 : ""
    //             }
    //             ${
    //               s.age
    //                 ? `<span class="chip chip-green">Age Group: ${escapeHtml(
    //                     s.age
    //                   )}</span>`
    //                 : ""
    //             }
    //           </div>
    //         </div>
    //         <div class="story-actions">
    //           <button class="btn-ghost" data-action="edit" data-id="${
    //             s.id
    //           }">Edit</button>
    //           <button class="btn-ghost danger" data-action="delete" data-id="${
    //             s.id
    //           }">Delete</button>
    //         </div>
    //       </div>
    //       ${
    //         s.keywords
    //           ? `<div class="story-meta"><strong>Keywords:</strong> ${escapeHtml(
    //               s.keywords
    //             )}</div>`
    //           : ""
    //       }
    //       <div class="story-text">${escapeHtml(
    //         truncate(s.storyText || "", 300)
    //       )}</div>
    //       <div class="story-meta">ID: ${escapeHtml(s.id)}</div>
    //     </div>
    //   `;
    // });

    // storiesList.innerHTML = html;
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length <= 1) return [];

    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      values.push(current);

      // Now we accept rows with at least 6 columns:
      // Either:
      //   [Entity, Virtue(s), Keywords, Age, Group, StoryText]
      // or:
      //   [ID, Entity, Virtue(s), Keywords, Age, Group, StoryText]
      if (values.length >= 6) {
        rows.push(values);
      }
    }
    return rows;
  }

  function handleImportCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCsv(text);
        const newStories = [];
        let duplicateCount = 0;

        rows.forEach((cols) => {
          let entity, virtues, keywords, age, group, storyText;

          if (cols.length >= 7) {
            // Old style with ID column -> ignore the first column
            [, entity, virtues, keywords, age, group, storyText] = cols;
          } else {
            // New style with no ID column
            [entity, virtues, keywords, age, group, storyText] = cols;
          }

          entity = (entity || "").replace(/^"|"$/g, "").trim();
          virtues = (virtues || "").replace(/^"|"$/g, "").trim();
          keywords = (keywords || "").replace(/^"|"$/g, "").trim();
          age = (age || "").trim();
          group = (group || "").replace(/^"|"$/g, "").trim();
          const storyTextClean = (storyText || "")
            .replace(/^"|"$/g, "")
            .trim();

          // Ignore completely empty story text
          if (!storyTextClean) return;

          // Duplicate check ONLY on Story Text
          if (storyExistsWithText(storyTextClean)) {
            duplicateCount++;
            return;
          }

          const story = {
            id: null, // will be assigned in reindexStories()
            entity,
            virtues,
            keywords,
            age,
            group,
            storyText: storyTextClean,
            timestamp: new Date().toISOString(),
          };

          newStories.push(story);
        });

        if (newStories.length > 0) {
          stories = stories.concat(newStories);
          reindexStories();
          saveStories();
          renderFilters();
          renderStories();

          let msg = `Successfully imported ${newStories.length} stories!`;
          if (duplicateCount > 0) {
            msg += ` ${duplicateCount} duplicate stor${
              duplicateCount > 1 ? "ies were" : "y was"
            } skipped.`;
          }
          alert(msg);
        } else {
          if (duplicateCount > 0) {
            alert(
              "No valid new stories found. All rows were duplicates or invalid."
            );
          } else {
            alert("No valid rows found in CSV.");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error importing CSV. Please check the file format.");
      } finally {
        csvFileInput.value = "";
      }
    };

    reader.readAsText(file);
  }

  function escapeCsv(value) {
    if (value == null) return "";
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  function exportToCsv() {
    if (stories.length === 0) {
      alert("No data to export.");
      return;
    }

    // ✅ No "ID" column anymore
    const headers = [
      "Entity/Name",
      "Virtue(s)",
      "Keywords/Synonyms",
      "Age",
      "Group",
      "StoryText",
    ];

    const lines = [headers.join(",")];

    stories.forEach((s) => {
      const row = [
        escapeCsv(s.entity || ""),
        escapeCsv(s.virtues || ""),
        escapeCsv(s.keywords || ""),
        s.age || "",
        escapeCsv(s.group || ""),
        escapeCsv(s.storyText || ""),
      ];
      lines.push(row.join(","));
    });

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `story_annotations_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------ AUTH LOGIC ------------ */

    /* ------------ AUTH LOGIC (REWRITTEN CLEANLY) ------------ */

    // SIGNUP INPUTS
    const suUser = document.getElementById("signup-username");
    const suFirst = document.getElementById("signup-firstname");
    const suMiddle = document.getElementById("signup-middlename");
    const suLast = document.getElementById("signup-lastname");
    const suEmail = document.getElementById("signup-email");
    const suPhone = document.getElementById("signup-phone");
    const suPass = document.getElementById("signup-password");
    const suCPass = document.getElementById("signup-confirm-password");
    const psBar = document.getElementById("ps-bar");
    const signupError = document.getElementById("signup-error");

    // LOGIN INPUTS
    const loginUser = loginUsername;
    const loginPass = loginPassword;

    // SWITCH TABS
    function switchToLoginTab() {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    showElement(loginPanel);
    hideElement(signupPanel);
    }

    function switchToSignupTab() {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    showElement(signupPanel);
    hideElement(loginPanel);
    }

    tabLogin.addEventListener("click", switchToLoginTab);
    tabSignup.addEventListener("click", switchToSignupTab);

    // VALIDATORS
    function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validPhone(num) {
    return /^[0-9]{10}$/.test(num);
    }

    // PASSWORD STRENGTH METER
    suPass.addEventListener("input", () => {
    const pass = suPass.value;
    let score = 0;

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    psBar.style.width = (score * 20) + "%";

    if (score <= 2) psBar.style.background = "red";
    else if (score === 3) psBar.style.background = "orange";
    else if (score === 4) psBar.style.background = "yellowgreen";
    else psBar.style.background = "green";
    });

    // SIGN UP
    signupBtn.addEventListener("click", () => {
    signupError.classList.add("hidden");

    if (
        !suUser.value ||
        !suFirst.value ||
        !suLast.value ||
        !suEmail.value ||
        !suPhone.value ||
        !suPass.value ||
        !suCPass.value
    ) {
        signupError.textContent = "All required fields must be filled.";
        signupError.classList.remove("hidden");
        return;
    }

    if (!validEmail(suEmail.value)) {
        signupError.textContent = "Invalid email format.";
        signupError.classList.remove("hidden");
        return;
    }

    if (!validPhone(suPhone.value)) {
        signupError.textContent = "Phone number must be 10 digits.";
        signupError.classList.remove("hidden");
        return;
    }

    if (suPass.value !== suCPass.value) {
        signupError.textContent = "Passwords do not match.";
        signupError.classList.remove("hidden");
        return;
    }

    const newUser = {
        username: suUser.value.trim(),
        firstname: suFirst.value.trim(),
        middlename: suMiddle.value.trim(),
        lastname: suLast.value.trim(),
        email: suEmail.value.trim(),
        phone: suPhone.value.trim(),
        password: suPass.value,
    };

    localStorage.setItem("sas_user", JSON.stringify(newUser));

    alert("Signup successful! Please log in.");
    switchToLoginTab();
    });

    // LOGIN
    loginBtn.addEventListener("click", () => {
    const username = loginUser.value.trim();
    const password = loginPass.value;

    if (!username || !password) {
        alert("Please enter username and password.");
        return;
    }

    const stored = localStorage.getItem("sas_user");
    if (!stored) {
        alert("No account found. Please sign up first.");
        return;
    }

    const user = JSON.parse(stored);

    if (user.username === username && user.password === password) {
        localStorage.setItem("sas_logged_in", "true");
        showApp(user.firstname);
    } else {
        alert("Invalid username or password.");
    }
    });

    // ENTER KEY LOGIN
    loginPassword.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginBtn.click();
    });
    loginUsername.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginBtn.click();
    });

    // SHOW APP AFTER LOGIN
    function showApp(name) {
    welcomeUserSpan.textContent = name || "User";
    hideElement(authContainer);
    showElement(appContainer);
    loadStories();
    }

    // AUTO LOGIN
    (function autoLogin() {
    const loggedIn = localStorage.getItem("sas_logged_in") === "true";
    const stored = localStorage.getItem("sas_user");
    if (loggedIn && stored) {
        const user = JSON.parse(stored);
        showApp(user.firstname || "User");
    }
    })();


  /* ------------ APP EVENTS ------------ */

  // Add Story toggle
    addStoryBtn.addEventListener("click", () => {
    clearForm();
    showElement(addStorySection);
    showElement(backArrow);
    mainHeader.classList.add("hidden");
    toolbar.classList.add("hidden");
    storiesSection.classList.add("hidden");
    });

    backArrow.addEventListener("click", () => {
    closeForm();    
    });

  // Save Story
  saveStoryBtn.addEventListener("click", () => {
    const entity = entityInput.value.trim();
    const storyText = storyTextInput.value.trim();

    if (!entity || !storyText) {
      alert("Entity/Name and Story Text are required.");
      return;
    }

    // Duplicate check (only on Story Text)
    if (!editingId && storyExistsWithText(storyText)) {
      alert("Story already exists.");
      return;
    }
    if (editingId && storyExistsWithText(storyText, editingId)) {
      alert("Another story with the same text already exists.");
      return;
    }

    const newStoryData = {
      entity,
      virtues: virtuesInput.value.trim(),
      keywords: keywordsInput.value.trim(),
      age: ageInput.value.trim(),
      group: groupInput.value.trim(),
      storyText,
      timestamp: new Date().toISOString(),
    };

    if (editingId) {
      stories = stories.map((s) =>
        String(s.id) === String(editingId)
          ? { ...s, ...newStoryData }
          : s
      );
    } else {
      stories.push({
        id: null, // will be assigned in reindexStories()
        ...newStoryData,
      });
    }

    reindexStories();
    saveStories();
    renderFilters();
    renderStories();
    closeForm();
  });

  // Cancel form
  cancelStoryBtn.addEventListener("click", () => {
    closeForm();
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value || "";
    renderStories();
  });

  // Age filter
  ageFilter.addEventListener("change", (e) => {
    currentAgeFilter = e.target.value;
    renderStories();
  });

  // Import CSV
  importCsvBtn.addEventListener("click", () => {
    csvFileInput.click();
  });

  csvFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleImportCsvFile(file);
  });

  // Export CSV
  exportCsvBtn.addEventListener("click", () => {
    exportToCsv();
  });

  // Story list actions (Edit/Delete) via event delegation
  storiesList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    const story = stories.find((s) => String(s.id) === String(id));
    if (!story) return;

    if (action === "edit") {
      openFormForEdit(story);
    } else if (action === "delete") {
      const ok = confirm("Are you sure you want to delete this story?");
      if (!ok) return;
      stories = stories.filter((s) => String(s.id) !== String(id));
      reindexStories();
      saveStories();
      renderFilters();
      renderStories();
    }
  });
});
