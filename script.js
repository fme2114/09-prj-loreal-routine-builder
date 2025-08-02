/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Array to store selected products */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Initialize selected products display */
updateSelectedProductsDisplay();

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

      /* Prevent double-click issues */
      e.preventDefault();

      /* Toggle flip state */
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
      if (scrollHint) scrollHint.style.display = "block";
    } else {
      if (scrollHint) scrollHint.style.display = "none";
    }
  });

  /* Add click event listeners to select buttons on card backs */
  const selectButtons = document.querySelectorAll(".select-product-btn");
  selectButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); /* Prevent card flip */

      const productId = parseInt(button.dataset.productId);
      toggleProductSelection(productId, products);

      /* Update button text based on selection state */
      updateSelectButton(button, productId);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

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
    selectedProductsList.innerHTML = selectedProducts
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
      .join("");

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
        const allProducts = await loadProducts(); /* Get current products */
        toggleProductSelection(productId, allProducts);
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
      const routine = await generateRoutineWithAI(routinePrompt);

      /* Replace loading message with routine */
      replaceLastMessage(routine);
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

/* Send request to OpenAI API */
async function generateRoutineWithAI(message) {
  /* Check if API key exists */
  if (
    typeof OPENAI_API_KEY === "undefined" ||
    OPENAI_API_KEY === "your-openai-api-key-here"
  ) {
    return "Please add your OpenAI API key to the secrets.js file to use AI features.";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful beauty and skincare expert. Provide personalized routine advice based on the products users have selected. Be friendly, knowledgeable, and practical.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* Add message to chat window */
function addMessageToChat(role, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}-message`;

  if (role === "user") {
    messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    messageDiv.innerHTML = `<strong>Beauty Assistant:</strong> ${message}`;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Replace the last message in chat (for loading states) */
function replaceLastMessage(newMessage) {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage && lastMessage.classList.contains("assistant-message")) {
    lastMessage.innerHTML = `<strong>Beauty Assistant:</strong> ${newMessage}`;
  }
}
