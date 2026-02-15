const menuData = {
  coffee: [
    { name: "Espresso", price: "$3.50", desc: "Bold and concentrated" },
    { name: "Americano", price: "$4.00", desc: "Smooth espresso with hot water" },
    { name: "Cappuccino", price: "$4.50", desc: "Espresso with steamed milk foam" },
    { name: "Latte", price: "$5.00", desc: "Creamy espresso with steamed milk" },
    { name: "Mocha", price: "$5.50", desc: "Chocolate espresso delight" },
    { name: "Cold Brew", price: "$4.50", desc: "Slow-steeped for 24 hours" },
    { name: "Flat White", price: "$4.75", desc: "Velvety micro-foam espresso" },
    { name: "Matcha Latte", price: "$5.50", desc: "Premium Japanese matcha" },
  ],
  pastries: [
    { name: "Butter Croissant", price: "$3.50", desc: "Flaky and golden" },
    { name: "Chocolate Muffin", price: "$3.75", desc: "Rich double chocolate" },
    { name: "Cinnamon Roll", price: "$4.25", desc: "Warm with cream cheese glaze" },
    { name: "Blueberry Scone", price: "$3.50", desc: "Fresh blueberries baked in" },
    { name: "Almond Danish", price: "$4.00", desc: "Topped with sliced almonds" },
    { name: "Banana Bread", price: "$3.25", desc: "Moist and homestyle" },
  ],
  food: [
    { name: "Avocado Toast", price: "$8.50", desc: "Sourdough with fresh avocado" },
    { name: "Club Sandwich", price: "$9.00", desc: "Turkey, bacon, lettuce, tomato" },
    { name: "Caesar Salad", price: "$8.00", desc: "Romaine, croutons, parmesan" },
    { name: "Breakfast Wrap", price: "$7.50", desc: "Eggs, cheese, peppers" },
    { name: "Grilled Panini", price: "$8.50", desc: "Mozzarella, tomato, basil" },
    { name: "Acai Bowl", price: "$9.50", desc: "Topped with granola and fruit" },
  ],
};

function renderMenu(category) {
  const grid = document.getElementById("menuGrid");
  const items = menuData[category];
  grid.innerHTML = items
    .map(
      (item) => `
    <div class="menu-item">
      <div class="menu-item-header">
        <h3>${item.name}</h3>
        <span class="price">${item.price}</span>
      </div>
      <p>${item.desc}</p>
    </div>
  `
    )
    .join("");
}

document.querySelectorAll(".menu-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".menu-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    renderMenu(tab.dataset.category);
  });
});

renderMenu("coffee");

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  navToggle.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    navToggle.classList.remove("active");
  });
});

document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.textContent = "Message Sent!";
  btn.style.background = "#2d6a4f";
  e.target.reset();
  setTimeout(() => {
    btn.textContent = "Send Message";
    btn.style.background = "";
  }, 3000);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
