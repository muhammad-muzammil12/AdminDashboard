"use strict";

/* ÉLORA ADMIN STUDIO — FRONTEND DEMO */

const STORAGE = {
  theme: "elora-admin-theme",
  users: "elora-admin-users"
};

const demoUsers = [
  { id: 1, name: "Ayesha Khan", email: "ayesha@example.com", joined: "2026-10-12", orders: 8, status: "Active" },
  { id: 2, name: "Hamza Ali", email: "hamza@example.com", joined: "2026-10-18", orders: 4, status: "Active" },
  { id: 3, name: "Sara Ahmed", email: "sara@example.com", joined: "2026-10-22", orders: 12, status: "Active" },
  { id: 4, name: "Usman Malik", email: "usman@example.com", joined: "2026-10-25", orders: 2, status: "Inactive" },
  { id: 5, name: "Zara Sheikh", email: "zara@example.com", joined: "2026-11-02", orders: 6, status: "Active" },
  { id: 6, name: "Ali Raza", email: "ali@example.com", joined: "2026-11-04", orders: 1, status: "Active" },
  { id: 7, name: "Hira Noor", email: "hira@example.com", joined: "2026-11-05", orders: 3, status: "Inactive" }
];

const orders = [
  { id: "EL-2048", name: "Ayesha Khan", date: "Nov 08, 2026", amount: 12500, status: "Completed" },
  { id: "EL-2047", name: "Hamza Ali", date: "Nov 08, 2026", amount: 8500, status: "Pending" },
  { id: "EL-2046", name: "Sara Ahmed", date: "Nov 07, 2026", amount: 16900, status: "Completed" },
  { id: "EL-2045", name: "Usman Malik", date: "Nov 07, 2026", amount: 4200, status: "Cancelled" },
  { id: "EL-2044", name: "Zara Sheikh", date: "Nov 06, 2026", amount: 7800, status: "Completed" }
];

const topProducts = [
  { name: "The Classic Blazer", category: "Clothing", sold: 48, revenue: 408000, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=120&q=75" },
  { name: "Minimalist Handbag", category: "Bags", sold: 36, revenue: 248400, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&q=75" },
  { name: "Essential White Shirt", category: "Clothing", sold: 29, revenue: 121800, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=120&q=75" },
  { name: "Classic Timepiece", category: "Accessories", sold: 18, revenue: 171000, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=120&q=75" }
];

const formatMoney = value =>
  "Rs. " + Number(value).toLocaleString("en-PK");

const escapeHTML = value =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    console.warn("Storage unavailable:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("Could not save data:", error);
    return false;
  }
}

function readUsers() {
  try {
    const stored = readStorage(STORAGE.users);
    if (!stored) return [...demoUsers];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...demoUsers];

    return parsed.filter(user =>
      user &&
      (typeof user.id === "string" || typeof user.id === "number") &&
      typeof user.name === "string" &&
      typeof user.email === "string" &&
      typeof user.joined === "string" &&
      ["Active", "Inactive"].includes(user.status)
    );
  } catch (error) {
    console.warn("Invalid saved users:", error);
    return [...demoUsers];
  }
}

let users = readUsers();
let revenueChart = null;
let sourceChart = null;
let analyticsChart = null;
let toastTimer = null;

/* NOTIFICATIONS */

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* THEME */

function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
  writeStorage(STORAGE.theme, theme);

  if (revenueChart || sourceChart || analyticsChart) {
    updateChartTheme();
  }
}

function toggleTheme() {
  const next = document.body.classList.contains("dark-theme")
    ? "light"
    : "dark";

  applyTheme(next);
}

function chartTextColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--muted").trim() || "#85899a";
}

function chartGridColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--border").trim() || "#ececf2";
}

function updateChartTheme() {
  const color = chartTextColor();
  const grid = chartGridColor();

  [revenueChart, analyticsChart].forEach(chart => {
    if (!chart) return;

    if (chart.options.scales.x?.ticks) {
      chart.options.scales.x.ticks.color = color;
    }

    if (chart.options.scales.y?.ticks) {
      chart.options.scales.y.ticks.color = color;
    }

    if (chart.options.scales.x?.grid) {
      chart.options.scales.x.grid.color = grid;
    }

    if (chart.options.scales.y?.grid) {
      chart.options.scales.y.grid.color = grid;
    }

    chart.update("none");
  });

  if (sourceChart) sourceChart.update("none");
}

/* CHART DATA */

function generateRevenueData(days) {
  const labels = [];
  const revenue = [];
  const previous = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    labels.push(
      days === 7
        ? date.toLocaleDateString("en", { weekday: "short" })
        : date.toLocaleDateString("en", {
            day: "numeric",
            month: "short"
          })
    );

    revenue.push(Math.round(9000 + Math.random() * 23000));
    previous.push(Math.round(7000 + Math.random() * 18000));
  }

  return { labels, revenue, previous };
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index"
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 7,
          color: chartTextColor(),
          font: { family: "DM Sans", size: 10 }
        }
      },
      tooltip: {
        backgroundColor: "#202334",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: context =>
            `${context.dataset.label}: ${formatMoney(context.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: chartTextColor(),
          maxTicksLimit: 8,
          font: { size: 9 }
        },
        border: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: chartGridColor() },
        ticks: {
          color: chartTextColor(),
          font: { size: 9 },
          callback: value =>
            value >= 1000 ? `${value / 1000}k` : value
        },
        border: { display: false }
      }
    }
  };
}

/* REVENUE CHART */

function initRevenueChart() {
  const canvas = document.getElementById("revenue-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const data = generateRevenueData(30);

  revenueChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Current revenue",
          data: data.revenue,
          borderColor: "#8069ef",
          backgroundColor: "rgba(128,105,239,.13)",
          fill: true,
          tension: .38,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: "Previous period",
          data: data.previous,
          borderColor: "#aeb4c5",
          borderDash: [5, 5],
          tension: .38,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: getChartOptions()
  });

  const period = document.getElementById("revenue-period");

  period?.addEventListener("change", () => {
    const next = generateRevenueData(Number(period.value));

    revenueChart.data.labels = next.labels;
    revenueChart.data.datasets[0].data = next.revenue;
    revenueChart.data.datasets[1].data = next.previous;
    revenueChart.update();
  });
}

/* ORDER SOURCE CHART */

function initSourceChart() {
  const canvas = document.getElementById("source-chart");
  if (!canvas || typeof Chart === "undefined") return;

  sourceChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Direct", "Social", "Referral"],
      datasets: [{
        data: [48, 32, 20],
        backgroundColor: ["#8069ef", "#4e91df", "#e9a05b"],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "76%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context =>
              `${context.label}: ${context.parsed}%`
          }
        }
      }
    }
  });
}

/* ANALYTICS CHART */

function initAnalyticsChart() {
  const canvas = document.getElementById("analytics-chart");
  if (!canvas || typeof Chart === "undefined") return;

  analyticsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Revenue (PKR)",
          data: [120000, 145000, 132000, 180000, 165000, 210000, 195000, 240000, 220000, 275000, 260000, 310000],
          backgroundColor: "rgba(128,105,239,.75)",
          borderRadius: 6
        },
        {
          label: "Orders",
          data: [18, 22, 20, 29, 25, 34, 31, 39, 36, 44, 42, 50],
          backgroundColor: "rgba(78,145,223,.75)",
          borderRadius: 6
        }
      ]
    },
    options: getChartOptions()
  });
}

/* DASHBOARD RENDERING */

function renderStats() {
  const completedRevenue = orders
    .filter(order => order.status === "Completed")
    .reduce((total, order) => total + order.amount, 0);

  document.getElementById("total-revenue").textContent =
    formatMoney(completedRevenue);

  document.getElementById("total-orders").textContent =
    orders.length;

  document.getElementById("total-customers").textContent =
    users.length;
}

function renderOrders() {
  const body = document.getElementById("recent-orders-body");
  if (!body) return;

  body.innerHTML = orders.map(order => `
    <tr>
      <td><strong>${escapeHTML(order.id)}</strong></td>
      <td>${escapeHTML(order.name)}</td>
      <td>${escapeHTML(order.date)}</td>
      <td>${formatMoney(order.amount)}</td>
      <td>
        <span class="status-pill status-${order.status.toLowerCase()}">
          ${escapeHTML(order.status)}
        </span>
      </td>
    </tr>
  `).join("");
}

function renderTopProducts() {
  const container = document.getElementById("top-products");
  if (!container) return;

  container.innerHTML = topProducts.map(product => `
    <div class="top-product">
      <img
        class="product-thumb"
        src="${product.image}"
        alt="${escapeHTML(product.name)}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >
      <div class="top-product-info">
        <strong>${escapeHTML(product.name)}</strong>
        <small>${escapeHTML(product.category)} · ${product.sold} sold</small>
      </div>
      <strong>${formatMoney(product.revenue)}</strong>
    </div>
  `).join("");
}

/* USER MANAGEMENT */

function saveUsers() {
  if (!writeStorage(STORAGE.users, JSON.stringify(users))) {
    showToast("Could not save changes in this browser.");
  }
}

function renderUserStats() {
  const active = users.filter(user => user.status === "Active").length;

  const now = new Date();
  const newUsers = users.filter(user => {
    const joined = new Date(user.joined);
    return joined.getMonth() === now.getMonth() &&
      joined.getFullYear() === now.getFullYear();
  }).length;

  document.getElementById("user-total").textContent = users.length;
  document.getElementById("user-active").textContent = active;
  document.getElementById("user-new").textContent = newUsers;
  document.getElementById("total-customers").textContent = users.length;
}

function renderUsers() {
  const body = document.getElementById("users-body");
  if (!body) return;

  const term = document.getElementById("user-search").value.trim().toLowerCase();
  const status = document.getElementById("user-status-filter").value;

  const filtered = users.filter(user => {
    const matchesText =
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term);

    const matchesStatus = status === "all" || user.status === status;

    return matchesText && matchesStatus;
  });

  document.getElementById("user-count-label").textContent =
    `Showing ${filtered.length} of ${users.length} users`;

  if (!filtered.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          No matching customers found.
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = filtered.map(user => `
    <tr>
      <td>
        <div class="customer-cell">
          <div class="avatar">
            ${escapeHTML(user.name.charAt(0).toUpperCase())}
          </div>
          <strong>${escapeHTML(user.name)}</strong>
        </div>
      </td>
      <td>${escapeHTML(user.email)}</td>
      <td>${escapeHTML(user.joined)}</td>
      <td>${Number(user.orders) || 0}</td>
      <td>
        <span class="status-pill status-${user.status.toLowerCase()}">
          ${escapeHTML(user.status)}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="table-action" data-edit="${user.id}">Edit</button>
          <button class="table-action delete" data-delete="${user.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* USER MODAL */

function openUserModal(user = null) {
  const modal = document.getElementById("user-modal");
  const form = document.getElementById("user-form");

  form.reset();

  document.getElementById("edit-user-id").value =
    user ? user.id : "";

  document.getElementById("modal-title").textContent =
    user ? "Edit customer" : "Add new user";

  document.getElementById("form-name").value =
    user ? user.name : "";

  document.getElementById("form-email").value =
    user ? user.email : "";

  document.getElementById("form-status").value =
    user ? user.status : "Active";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("form-name").focus();
}

function closeUserModal() {
  const modal = document.getElementById("user-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function saveUser(event) {
  event.preventDefault();

  const id = document.getElementById("edit-user-id").value;
  const name = document.getElementById("form-name").value.trim();
  const email = document.getElementById("form-email").value.trim().toLowerCase();
  const status = document.getElementById("form-status").value;

  if (!name || !email) return;

  const duplicate = users.find(user =>
    user.email.toLowerCase() === email &&
    String(user.id) !== id
  );

  if (duplicate) {
    showToast("This email address is already registered.");
    return;
  }

  if (id) {
    users = users.map(user =>
      String(user.id) === id
        ? { ...user, name, email, status }
        : user
    );

    showToast("Customer profile updated.");
  } else {
    users.unshift({
      id: Date.now(),
      name,
      email,
      joined: new Date().toISOString().slice(0, 10),
      orders: 0,
      status
    });

    showToast("New customer added.");
  }

  saveUsers();
  renderUsers();
  renderUserStats();
  renderStats();
  closeUserModal();
}

function deleteUser(id) {
  const user = users.find(item => String(item.id) === String(id));
  if (!user) return;

  if (!confirm(`Delete ${user.name} from this demo customer list?`)) return;

  users = users.filter(item => String(item.id) !== String(id));

  saveUsers();
  renderUsers();
  renderUserStats();
  renderStats();

  showToast("Customer removed.");
}

function editUser(id) {
  const user = users.find(item => String(item.id) === String(id));
  if (user) openUserModal(user);
}

/* CSV EXPORT */

function downloadCSV(filename, rows) {
  if (!rows.length) {
    showToast("There is no data to export.");
    return;
  }

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  showToast("CSV report downloaded.");
}

function exportUsers() {
  downloadCSV("elora-customers.csv", [
    ["Name", "Email", "Joined", "Orders", "Status"],
    ...users.map(user => [
      user.name,
      user.email,
      user.joined,
      user.orders,
      user.status
    ])
  ]);
}

function exportReport() {
  downloadCSV("elora-store-report.csv", [
    ["Metric", "Value"],
    ["Revenue from demo completed orders",
      orders.filter(order => order.status === "Completed")
        .reduce((sum, order) => sum + order.amount, 0)
    ],
    ["Demo orders", orders.length],
    ["Demo customers", users.length],
    ["Active customers",
      users.filter(user => user.status === "Active").length
    ]
  ]);
}

/* NAVIGATION */

function navigateTo(sectionId) {
  const section = sectionId === "orders" ? "overview" : sectionId;
  const target = document.getElementById(section);

  if (!target) return;

  document.querySelectorAll(".dashboard-section").forEach(item => {
    item.classList.toggle("active-section", item.id === section);
  });

  document.querySelectorAll("[data-section]").forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.section === sectionId
    );
  });

  const titles = {
    overview: "Overview",
    analytics: "Analytics",
    users: "User management",
    orders: "Orders"
  };

  document.getElementById("breadcrumb-title").textContent =
    titles[sectionId] || "Overview";

  history.replaceState(null, "", `#${sectionId}`);

  document.getElementById("sidebar")?.classList.remove("mobile-open");

  if (sectionId === "orders") {
    document.getElementById("orders")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  requestAnimationFrame(() => {
    [revenueChart, sourceChart, analyticsChart].forEach(chart => {
      if (chart) chart.resize();
    });
  });
}

function setupNavigation() {
  document.querySelectorAll("[data-section]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  document.getElementById("view-all-orders")?.addEventListener("click", () => {
    navigateTo("orders");
  });

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("mobile-open");
  });

  document.addEventListener("click", event => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("menu-toggle");

    if (
      window.innerWidth <= 600 &&
      sidebar.classList.contains("mobile-open") &&
      !sidebar.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      sidebar.classList.remove("mobile-open");
    }
  });
}

/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = readStorage(STORAGE.theme, "light");
  applyTheme(savedTheme || "light");

  document.getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  document.getElementById("theme-sidebar")
    ?.addEventListener("click", toggleTheme);

  document.getElementById("add-user-button")
    ?.addEventListener("click", () => openUserModal());

  document.getElementById("modal-close")
    ?.addEventListener("click", closeUserModal);

  document.getElementById("cancel-user")
    ?.addEventListener("click", closeUserModal);

  document.getElementById("user-form")
    ?.addEventListener("submit", saveUser);

  document.getElementById("user-modal")
    ?.addEventListener("click", event => {
      if (event.target.id === "user-modal") closeUserModal();
    });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeUserModal();
  });

  document.getElementById("user-search")
    ?.addEventListener("input", renderUsers);

  document.getElementById("user-status-filter")
    ?.addEventListener("change", renderUsers);

  document.getElementById("users-body")
    ?.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit]");
      const remove = event.target.closest("[data-delete]");

      if (edit) editUser(edit.dataset.edit);
      if (remove) deleteUser(remove.dataset.delete);
    });

  document.getElementById("user-export")
    ?.addEventListener("click", exportUsers);

  document.getElementById("export-report")
    ?.addEventListener("click", exportReport);

  document.getElementById("analytics-export")
    ?.addEventListener("click", exportReport);

  setupNavigation();

  renderStats();
  renderOrders();
  renderTopProducts();
  renderUserStats();
  renderUsers();

  if (typeof Chart !== "undefined") {
    initRevenueChart();
    initSourceChart();
    initAnalyticsChart();
  } else {
    showToast("Charts could not load. Check your internet connection.");
  }

  const initialSection = location.hash.replace("#", "");

  if (["overview", "analytics", "users", "orders"].includes(initialSection)) {
    navigateTo(initialSection);
  }
});
