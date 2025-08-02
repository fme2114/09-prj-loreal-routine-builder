/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Array to store selected products */
let selectedProducts = [];

/* Array to store conversation history for context */
let conversationHistory = [];

/* Store all products for filtering */
let allProducts = [];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    try {
      selectedProducts = JSON.parse(savedProducts);
    } catch (error) {
      console.error("Error loading saved products:", error);
      selectedProducts = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search for products
  </div>
`;

/* Load selected products from storage first */
loadSelectedProductsFromStorage();

/* Initialize the application */
async function initializeApp() {
  /* Load all products once at startup */
  allProducts = await loadProducts();

  /* Initialize selected products display */
  updateSelectedProductsDisplay();

  /* Add welcome message to chat */
  addWelcomeMessage();
}

/* Initialize the app */
initializeApp();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-inner">
        <div class="product-card-front">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <div class="click-instruction">Click to learn more</div>
          </div>
        </div>
        <div class="product-card-back">
          <div class="product-description">
            <h4>${product.name}</h4>
            <p>${product.description}</p>
          </div>
          <div class="scroll-hint">Scroll to read more</div>
          <button class="select-product-btn" data-product-id="${product.id}">
            <i class="fa-solid fa-plus"></i> Add to Routine
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to all product cards */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      /* Don't flip if clicking on the select button */
      if (e.target.closest(".select-product-btn")) {
        return;
      }

      /* Toggle the flip class */
      card.classList.toggle("flipped");
    });
  });

  /* Check for overflow in product descriptions */
  const productDescriptions = document.querySelectorAll(".product-description");
  productDescriptions.forEach((desc) => {
    const scrollHint = desc.parentElement.querySelector(".scroll-hint");

    /* Check if content overflows the container */
    if (desc.scrollHeight > desc.clientHeight) {
      desc.classList.add("has-overflow");
      scrollHint.style.display = "block";
    } else {
      desc.classList.remove("has-overflow");
      scrollHint.style.display = "none";
    }
  });

  /* Add click event listeners to select buttons on card backs */
  const selectButtons = document.querySelectorAll(".select-product-btn");
  selectButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation(); /* Prevent card flip */
      const productId = button.dataset.productId;
      toggleProductSelection(productId, allProducts); /* Use cached products */
    });
  });

  /* Update visual state for already selected products */
  products.forEach((product) => {
    const isSelected = selectedProducts.some((p) => p.id === product.id);
    if (isSelected) {
      updateProductCardVisual(product.id);
    }
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", (e) => {
  filterAndDisplayProducts();
});

/* Filter and display products when search input changes */
searchInput.addEventListener("input", (e) => {
  filterAndDisplayProducts();
});

/* Filter products based on both search and category */
function filterAndDisplayProducts() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;

  let filteredProducts = allProducts;

  /* Filter by category if one is selected (but not "all") */
  if (selectedCategory && selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  /* Filter by search term if one is entered */
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    });
  }

  /* Show placeholder if no filters are applied */
  if (!searchTerm && !selectedCategory) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category or search for products
      </div>
    `;
    return;
  }

  /* Show results or no results message */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found matching your criteria. Try a different search or category.
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
  }
}

/* Toggle product selection when clicked */
function toggleProductSelection(productId, products) {
  /* Convert productId to number since dataset returns strings */
  const numericProductId = parseInt(productId);

  /* Find the product by its ID */
  const product = products.find((p) => p.id === numericProductId);

  /* Check if product is already selected */
  const existingIndex = selectedProducts.findIndex(
    (p) => p.id === numericProductId
  );

  if (existingIndex === -1) {
    /* Product not selected - add it to selected products */
    selectedProducts.push(product);
  } else {
    /* Product already selected - remove it from selected products */
    selectedProducts.splice(existingIndex, 1);
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Clear conversation history when products change */
  /* This ensures AI responses are relevant to current selection */
  conversationHistory = [];

  /* Update the visual state of the product card */
  updateProductCardVisual(numericProductId);

  /* Update the selected products display */
  updateSelectedProductsDisplay();
}

/* Update the visual appearance of a product card */
function updateProductCardVisual(productId) {
  const productCard = document.querySelector(
    `[data-product-id="${productId}"]`
  );

  /* Check if this product is selected */
  const isSelected = selectedProducts.some((p) => p.id === productId);

  if (isSelected) {
    /* Add 'selected' class to show it's chosen */
    productCard.classList.add("selected");
  } else {
    /* Remove 'selected' class */
    productCard.classList.remove("selected");
  }

  /* Update the select button if it exists */
  const selectButton = productCard.querySelector(".select-product-btn");
  if (selectButton) {
    updateSelectButton(selectButton, productId);
  }
}

/* Update the select button text and icon based on selection state */
function updateSelectButton(button, productId) {
  const isSelected = selectedProducts.some((p) => p.id === productId);

  if (isSelected) {
    button.innerHTML = '<i class="fa-solid fa-check"></i> Added to Routine';
    button.classList.add("selected");
  } else {
    button.innerHTML = '<i class="fa-solid fa-plus"></i> Add to Routine';
    button.classList.remove("selected");
  }
}

/* Update the selected products list display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      "<p>No products selected yet. Click on products to add them!</p>";
  } else {
    selectedProductsList.innerHTML = `
      <div class="selected-products-header">
        <span class="selected-count">${selectedProducts.length} product${
      selectedProducts.length === 1 ? "" : "s"
    } selected</span>
        <button id="clearAllProducts" class="clear-all-btn">
          <i class="fa-solid fa-trash"></i> Clear All
        </button>
      </div>
      ${selectedProducts
        .map(
          (product) => `
          <div class="selected-product-item">
            <img src="${product.image}" alt="${product.name}">
            <div class="selected-product-info">
              <h4>${product.name}</h4>
              <p>${product.brand}</p>
            </div>
            <button class="remove-product-btn" data-product-id="${product.id}">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        `
        )
        .join("")}`;

    /* Add click listener to clear all button */
    const clearAllBtn = document.getElementById("clearAllProducts");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", clearAllProducts);
    }

    /* Add click listeners to remove buttons */
    const removeButtons = selectedProductsList.querySelectorAll(
      ".remove-product-btn"
    );
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation(); /* Prevent card click */
        const productId = parseInt(
          button.dataset.productId
        ); /* Convert to number */
        toggleProductSelection(
          productId,
          allProducts
        ); /* Use cached products */
      });
    });
  }
}

/* Chat form submission handler - OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  /* Add user message to chat */
  addMessageToChat("user", userMessage);
  userInput.value = "";

  /* Show loading message */
  addMessageToChat("assistant", "Thinking...");

  try {
    /* Generate response using OpenAI */
    const response = await generateRoutineWithAI(userMessage);

    /* Replace loading message with actual response */
    replaceLastMessage(response);
  } catch (error) {
    replaceLastMessage("Sorry, I encountered an error. Please try again.");
    console.error("OpenAI API Error:", error);
  }
});

/* Generate Routine button handler */
document
  .getElementById("generateRoutine")
  .addEventListener("click", async () => {
    if (selectedProducts.length === 0) {
      addMessageToChat(
        "assistant",
        "Please select some products first before generating a routine!"
      );
      return;
    }

    /* Show loading message */
    addMessageToChat("assistant", "Creating your personalized routine...");

    try {
      /* Create routine prompt with selected products */
      const routinePrompt = createRoutinePrompt(selectedProducts);
      const routine = await generateRoutineWithAI(routinePrompt, true);

      /* Replace loading message with routine */
      replaceLastMessage(routine);

      /* Add a helpful follow-up message */
      setTimeout(() => {
        addMessageToChat(
          "assistant",
          "Feel free to ask me any follow-up questions about your routine, like how to use specific products, timing, or modifications for your skin type! 💄✨"
        );
      }, 1000);
    } catch (error) {
      replaceLastMessage(
        "Sorry, I encountered an error generating your routine. Please try again."
      );
      console.error("OpenAI API Error:", error);
    }
  });

/* Create a routine prompt from selected products */
function createRoutinePrompt(products) {
  const productInfo = products.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  return `Create a personalized beauty routine using these products: ${JSON.stringify(
    productInfo
  )}. 
  
  Please provide:
  1. A step-by-step routine (AM/PM if applicable)
  2. How to use each product
  3. Tips for best results
  4. Any important application order
  
  Make it friendly and easy to follow!`;
}

/* Send request to OpenAI API (via Cloudflare Worker or direct) */
async function generateRoutineWithAI(message, isRoutineGeneration = false) {
  /* Check if using Cloudflare Worker or direct API */
  if (USE_CLOUDFLARE_WORKER) {
    /* Check if Cloudflare Worker URL is configured */
    if (
      typeof CLOUDFLARE_WORKER_URL === "undefined" ||
      CLOUDFLARE_WORKER_URL === "YOUR_CLOUDFLARE_WORKER_URL_HERE"
    ) {
      return "Please configure your Cloudflare Worker URL in config.js to use AI features.";
    }
  } else {
    /* Check if API key exists for direct API calls */
    if (
      typeof OPENAI_API_KEY === "undefined" ||
      OPENAI_API_KEY === "your-openai-api-key-here"
    ) {
      return "Please add your OpenAI API key to the config.js file or configure Cloudflare Worker to use AI features.";
    }
  }

  /* Build messages array with conversation history */
  let messages = [
    {
      role: "system",
      content: `You are a helpful beauty and skincare expert specializing in personalized routine advice. 
      
      Focus on topics related to:
      - Skincare routines and products
      - Haircare and hair styling
      - Makeup application and techniques  
      - Fragrance recommendations
      - Beauty tips and best practices
      - Product ingredients and benefits
      - Skin types and concerns
      
      Always provide practical, friendly, and knowledgeable advice. If asked about topics outside beauty/personal care, politely redirect the conversation back to beauty-related topics.
      
      ${
        selectedProducts.length > 0
          ? `The user has selected these products: ${JSON.stringify(
              selectedProducts.map((p) => ({
                name: p.name,
                brand: p.brand,
                category: p.category,
              }))
            )}`
          : ""
      }`,
    },
  ];

  /* Add conversation history for context */
  messages = messages.concat(conversationHistory);

  /* Add current message */
  messages.push({
    role: "user",
    content: message,
  });

  /* Prepare request body */
  const requestBody = {
    model: "gpt-4o",
    messages: messages,
    max_completion_tokens: 1000, // Changed from max_tokens to match Worker
    temperature: 0.7,
  };

  let response;

  if (USE_CLOUDFLARE_WORKER) {
    /* Use Cloudflare Worker proxy - no /api/openai path needed */
    response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } else {
    /* Direct OpenAI API call */
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  /* Add to conversation history (keep last 10 exchanges to manage token limits) */
  conversationHistory.push({ role: "user", content: message });
  conversationHistory.push({ role: "assistant", content: aiResponse });

  /* Keep only last 10 exchanges (20 messages) */
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  return aiResponse;
}

/* Add message to chat window */
function addMessageToChat(role, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}-message`;

  if (role === "user") {
    messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    // Format AI responses for better readability
    const formattedMessage = formatAIResponse(message);
    messageDiv.innerHTML = `<strong>Beauty Expert:</strong> ${formattedMessage}`;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Format AI response text for better readability */
function formatAIResponse(text) {
  return (
    text
      // Convert numbered lists (1. 2. 3. etc.)
      .replace(/^(\d+)\.\s+(.+)$/gm, "<p><strong>$1.</strong> $2</p>")
      // Convert bullet points (- or *)
      .replace(/^[-*]\s+(.+)$/gm, "<p>• $1</p>")
      // Add spacing after sentences ending with colons
      .replace(/([^:]):(\s*[A-Z])/g, "$1:<br><br>$2")
      // Convert double line breaks to paragraph breaks
      .replace(/\n\n/g, "</p><p>")
      // Convert single line breaks to <br> tags
      .replace(/\n/g, "<br>")
      // Wrap the whole thing in paragraphs if it doesn't already have them
      .replace(/^(?!<p>)/, "<p>")
      .replace(/(?!<\/p>)$/, "</p>")
      // Clean up any empty paragraphs
      .replace(/<p><\/p>/g, "")
      .replace(/<p><br><\/p>/g, "")
  );
}

/* Replace the last message in chat (for loading states) */
function replaceLastMessage(newMessage) {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage && lastMessage.classList.contains("assistant-message")) {
    const formattedMessage = formatAIResponse(newMessage);
    lastMessage.innerHTML = `<strong>Beauty Expert:</strong> ${formattedMessage}`;
  }
}

/* Add welcome message when page loads */
function addWelcomeMessage() {
  const hasSelectedProducts = selectedProducts.length > 0;

  let welcomeMessage = `Hi! I'm your personal beauty expert! 👋

I can help you with:
• Creating personalized beauty routines
• Skincare advice and product recommendations  
• Makeup tips and techniques
• Haircare guidance
• Fragrance suggestions

${
  hasSelectedProducts
    ? `I see you have ${selectedProducts.length} product${
        selectedProducts.length === 1 ? "" : "s"
      } selected from your previous visit! You can generate a routine with them or select more products.`
    : "Select some products above and I'll create a custom routine for you, or ask me any beauty-related questions!"
}`;

  addMessageToChat("assistant", welcomeMessage);
}

/* Clear all selected products */
function clearAllProducts() {
  /* Confirm before clearing */
  if (confirm("Are you sure you want to clear all selected products?")) {
    selectedProducts = [];
    saveSelectedProductsToStorage();
    conversationHistory = []; /* Clear conversation history too */

    /* Update the display */
    updateSelectedProductsDisplay();

    /* Update visual state of all product cards */
    const allProductCards = document.querySelectorAll(".product-card");
    allProductCards.forEach((card) => {
      card.classList.remove("selected");
      const selectButton = card.querySelector(".select-product-btn");
      if (selectButton) {
        selectButton.innerHTML =
          '<i class="fa-solid fa-plus"></i> Add to Routine';
        selectButton.classList.remove("selected");
      }
    });

    /* Add confirmation message to chat */
    addMessageToChat(
      "assistant",
      "All products have been cleared! Feel free to select new products for a fresh routine. 🧹✨"
    );
  }
}
